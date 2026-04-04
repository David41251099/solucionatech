import { useEffect, useRef, useState } from "react";
import { socket } from "../socket/socket";
import { SOCKET_EVENTS } from "../socket/events";
import { getTicketMessages, sendTicketMessage } from "../services/ticket.service";
import { uploadFile } from "../services/upload.service";
import type { TicketMessage } from "../types";
import { devWarn } from "../utils/devLog";

interface UseTicketConversationOptions {
  ticketId?: string | null;
  currentUserId?: string;
}

type SocketAck<T = unknown> = {
  success?: boolean;
  data?: T;
  message?: string;
};

export function useTicketConversation({
  ticketId,
  currentUserId,
}: UseTicketConversationOptions) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousTicketIdRef = useRef<string | null>(null);

  const appendMessageIfMissing = (message: TicketMessage) => {
    if (!message?.id) return;
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  };

  useEffect(() => {
    if (!ticketId) {
      setMessages([]);
      setDraft("");
      setSelectedFile(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getTicketMessages(ticketId);
        if (!isMounted) return;
        setMessages(Array.isArray(data) ? data : []);
      } catch {
        if (!isMounted) return;
        setMessages([]);
        setError("No se pudieron cargar los mensajes.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId) return;

    const previousTicketId = previousTicketIdRef.current;
    if (previousTicketId && previousTicketId !== ticketId) {
      socket.emit(SOCKET_EVENTS.TICKET_LEAVE, { ticketId: previousTicketId }, (ack?: SocketAck) => {
        if (ack && ack.success === false) {
          devWarn("ticket:leave rechazado:", ack.message);
        }
      });
    }

    if (!ticketId) {
      devWarn("ticket:join omitido: ticketId undefined");
      return;
    }

    socket.emit(SOCKET_EVENTS.TICKET_JOIN, { ticketId }, (ack?: SocketAck) => {
      if (ack && ack.success === false) {
        setError(ack.message || "No se pudo unir al ticket.");
      }
    });
    previousTicketIdRef.current = ticketId;

    return () => {
      if (!ticketId) return;
      socket.emit(SOCKET_EVENTS.TICKET_LEAVE, { ticketId }, (ack?: SocketAck) => {
        if (ack && ack.success === false) {
          devWarn("ticket:leave rechazado:", ack.message);
        }
      });
      if (previousTicketIdRef.current === ticketId) {
        previousTicketIdRef.current = null;
      }
    };
  }, [ticketId]);

  useEffect(() => {
    const handleMessageNew = (message: TicketMessage) => {
      if (!ticketId || message.ticket_id !== ticketId) return;

      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleMessageNew);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleMessageNew);
    };
  }, [ticketId]);

  useEffect(() => {
    const onReconnectJoin = () => {
      const activeTicketId = previousTicketIdRef.current;
      if (!activeTicketId) return;

      socket.emit(SOCKET_EVENTS.TICKET_JOIN, { ticketId: activeTicketId }, (ack?: SocketAck) => {
        if (ack && ack.success === false) {
          setError(ack.message || "No se pudo restablecer el chat tras reconexión.");
        }
      });
    };

    socket.on("connect", onReconnectJoin);
    return () => {
      socket.off("connect", onReconnectJoin);
    };
  }, []);

  const sendMessage = async () => {
    const trimmed = draft.trim();
    if (!ticketId || !currentUserId || (!trimmed && !selectedFile)) return;

    const previousDraft = draft;
    const previousFile = selectedFile;

    try {
      setIsSending(true);
      setError(null);
      setDraft("");
      setSelectedFile(null);

      let fileUrl: string | null = null;
      if (previousFile) {
        fileUrl = await uploadFile(previousFile);
      }

      if (socket.connected) {
        socket.emit(
          SOCKET_EVENTS.MESSAGE_SEND,
          { ticketId, message: trimmed, file_url: fileUrl },
          (ack?: SocketAck<{ message?: TicketMessage }>) => {
            if (ack && ack.success === false) {
              setError(ack.message || "No se pudo enviar el mensaje.");
              return;
            }

            const ackMessage = ack?.data?.message;
            if (ackMessage) {
              appendMessageIfMissing(ackMessage);
            }
          }
        );
        return;
      }

      const created = await sendTicketMessage(ticketId, trimmed || undefined, fileUrl || undefined);
      appendMessageIfMissing(created);
    } catch {
      setDraft(previousDraft);
      setSelectedFile(previousFile);
      setError("No se pudo enviar el mensaje.");
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages,
    draft,
    setDraft,
    selectedFile,
    setSelectedFile,
    isLoading,
    isSending,
    error,
    sendMessage,
  };
}

