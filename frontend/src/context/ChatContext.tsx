import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../hooks/useAuth";
import { socket } from "../services/socket";
import { SOCKET_EVENTS } from "../socket/events";
import {
  getTicketMessages,
  getTickets,
  sendMessageWithAttachment,
  sendTicketMessage,
} from "../services/ticket.service";
import type { Ticket, TicketMessage } from "../types";
import { devLog, devWarn } from "../utils/devLog";

export type Message = TicketMessage;

export type ChatState = {
  isOpen: boolean;
  selectedTicketId: string | null;
  tickets: Ticket[];
  messages: Record<string, Message[]>;
};

type SendMessagePayload = {
  message?: string;
  file?: File | null;
  formData?: FormData;
};

type SocketAck<T = unknown> = {
  success?: boolean;
  data?: T;
  message?: string;
};

type ChatContextValue = ChatState & {
  isLoadingTickets: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;
  setIsOpen: (value: boolean) => void;
  toggleOpen: () => void;
  selectTicket: (ticketId: string | null) => void;
  refreshTickets: () => Promise<void>;
  refreshMessages: (ticketId: string) => Promise<void>;
  sendMessage: (payload: SendMessagePayload) => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

const sortByDateAsc = (items: Message[]) =>
  [...items].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<ChatState>({
    isOpen: false,
    selectedTicketId: null,
    tickets: [],
    messages: {},
  });
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeTicketRef = useRef<string | null>(null);

  const appendMessageIfMissing = useCallback((message: Message) => {
    if (!message?.id || !message?.ticket_id) return;

    setState((prev) => {
      const current = prev.messages[message.ticket_id] ?? [];
      if (current.some((item) => item.id === message.id)) {
        return prev;
      }

      return {
        ...prev,
        messages: {
          ...prev.messages,
          [message.ticket_id]: sortByDateAsc([...current, message]),
        },
      };
    });
  }, []);

  const refreshTickets = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setState((prev) => ({ ...prev, tickets: [] }));
      return;
    }

    try {
      setIsLoadingTickets(true);
      setError(null);
      const tickets = await getTickets();
      const filtered =
        user.role === "client"
          ? tickets.filter(
              (ticket) => ticket.client_id === user.id && ticket.status !== "pending"
            )
          : tickets.filter((ticket) => ticket.technician_id === user.id);

      setState((prev) => {
        const selectedExists = prev.selectedTicketId
          ? filtered.some((ticket) => ticket.id === prev.selectedTicketId)
          : false;
        return {
          ...prev,
          tickets: filtered,
          selectedTicketId: selectedExists ? prev.selectedTicketId : null,
        };
      });
    } catch {
      setState((prev) => ({ ...prev, tickets: [] }));
      setError("No se pudieron cargar los tickets del chat.");
    } finally {
      setIsLoadingTickets(false);
    }
  }, [isAuthenticated, user]);

  const refreshMessages = useCallback(async (ticketId: string) => {
    if (!ticketId) return;

    try {
      setIsLoadingMessages(true);
      setError(null);
      const data = await getTicketMessages(ticketId);
      setState((prev) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [ticketId]: sortByDateAsc(Array.isArray(data) ? data : []),
        },
      }));
    } catch {
      setError("No se pudieron cargar los mensajes.");
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const selectTicket = useCallback((ticketId: string | null) => {
    if (ticketId !== null && (typeof ticketId !== "string" || !ticketId.trim())) {
      devWarn("Ticket inválido en selectTicket:", ticketId);
      return;
    }

    devLog("SETTING selectedTicketId:", ticketId);
    setError(null);
    setState((prev) => ({ ...prev, selectedTicketId: ticketId }));
  }, []);

  const sendMessage = useCallback(
    async ({ message, file, formData }: SendMessagePayload) => {
      const ticketId = state.selectedTicketId;
      if (!ticketId || !user?.id) return;

      const trimmed = message?.trim() ?? "";
      if (!trimmed && !file && !formData) return;

      try {
        setIsSending(true);
        setError(null);

        const messageFormData =
          formData ||
          (() => {
            const generated = new FormData();
            if (trimmed) generated.append("message", trimmed);
            if (file) generated.append("file", file);
            return generated;
          })();

        let created: Message | null = null;
        if (file || messageFormData.get("file")) {
          created = await sendMessageWithAttachment(ticketId, messageFormData);
        } else {
          if (socket.connected) {
            socket.emit(SOCKET_EVENTS.MESSAGE_SEND, { ticketId, message: trimmed }, (ack?: SocketAck<{ message?: Message }>) => {
              if (ack && ack.success === false) {
                setError(ack.message || "No se pudo enviar el mensaje.");
                return;
              }

              const ackMessage = ack?.data?.message as Message | undefined;
              if (ackMessage) {
                appendMessageIfMissing(ackMessage);
              }
            });
            return;
          }

          created = await sendTicketMessage(ticketId, trimmed || undefined);
        }

        if (!created) {
          return;
        }

        appendMessageIfMissing(created);
      } catch {
        setError("No se pudo enviar el mensaje.");
      } finally {
        setIsSending(false);
      }
    },
    [appendMessageIfMissing, state.selectedTicketId, user?.id]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setState({
        isOpen: false,
        selectedTicketId: null,
        tickets: [],
        messages: {},
      });
      return;
    }

    refreshTickets();
  }, [isAuthenticated, refreshTickets]);

  useEffect(() => {
    const selectedTicketId = state.selectedTicketId;
    if (!selectedTicketId) return;

    refreshMessages(selectedTicketId);
  }, [state.selectedTicketId, refreshMessages]);

  useEffect(() => {
    const selectedTicketId = state.selectedTicketId;
    if (!selectedTicketId) return;
    if (state.tickets.length === 0) {
      return;
    }
    const ticketExistsInState = state.tickets.some((ticket) => ticket.id === selectedTicketId);
    if (!ticketExistsInState) {
      devWarn("ticket:join cancelado: selectedTicketId no existe en tickets actuales", {
        selectedTicketId,
        ticketsCount: state.tickets.length,
      });
      if (activeTicketRef.current === selectedTicketId) {
        activeTicketRef.current = null;
      }
      return;
    }

    if (activeTicketRef.current && activeTicketRef.current !== selectedTicketId) {
      socket.emit(SOCKET_EVENTS.TICKET_LEAVE, { ticketId: activeTicketRef.current }, (ack?: SocketAck) => {
        if (ack && ack.success === false) {
          devWarn("ticket:leave rechazado:", ack.message);
        }
      });
    }

    socket.emit(SOCKET_EVENTS.TICKET_JOIN, { ticketId: selectedTicketId }, (ack?: SocketAck) => {
      if (ack && ack.success === false) {
        setError(ack.message || "No se pudo unir al ticket.");
      }
    });
    activeTicketRef.current = selectedTicketId;

    return () => {
      socket.emit(SOCKET_EVENTS.TICKET_LEAVE, { ticketId: selectedTicketId }, (ack?: SocketAck) => {
        if (ack && ack.success === false) {
          devWarn("ticket:leave rechazado:", ack.message);
        }
      });
      if (activeTicketRef.current === selectedTicketId) {
        activeTicketRef.current = null;
      }
    };
  }, [state.selectedTicketId, state.tickets]);

  useEffect(() => {
    const onReconnectJoin = () => {
      const activeTicketId = activeTicketRef.current;
      devLog("Rejoin check:", {
        ref: activeTicketRef.current,
        state: state.selectedTicketId,
      });
      if (!activeTicketId) return;

      if (activeTicketId !== state.selectedTicketId) {
        devWarn("Ticket desincronizado, se cancela rejoin");
        return;
      }
      if (state.tickets.length === 0) {
        return;
      }
      const ticketExistsInState = state.tickets.some((ticket) => ticket.id === activeTicketId);
      if (!ticketExistsInState) {
        devWarn("Ticket no existe en estado actual, se cancela rejoin", {
          activeTicketId,
          ticketsCount: state.tickets.length,
        });
        activeTicketRef.current = null;
        return;
      }
      devLog("Rejoin automático:", activeTicketId);

      socket.emit(
        SOCKET_EVENTS.TICKET_JOIN,
        { ticketId: activeTicketId },
        (ack?: SocketAck) => {
          if (ack && ack.success === false) {
            devWarn("Rejoin falló:", ack.message);
            activeTicketRef.current = null;
            setError(ack.message || "No se pudo restablecer el chat tras reconexión.");
          }
        }
      );
    };

    socket.on("connect", onReconnectJoin);
    return () => {
      socket.off("connect", onReconnectJoin);
    };
  }, [state.selectedTicketId, state.tickets]);

  useEffect(() => {
    const handleMessageNew = (message: Message) => {
      setState((prev) => {
        const current = prev.messages[message.ticket_id] ?? [];
        if (current.some((item) => item.id === message.id)) return prev;
        return {
          ...prev,
          messages: {
            ...prev.messages,
            [message.ticket_id]: sortByDateAsc([...current, message]),
          },
        };
      });
    };

    const handleTicketUpdated = () => {
      refreshTickets();
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleMessageNew);
    socket.on("ticket:updated", handleTicketUpdated);
    socket.on("ticket:statusUpdated", handleTicketUpdated);
    socket.on("ticketAssigned", handleTicketUpdated);
    socket.on("ticketReleased", handleTicketUpdated);
    socket.on("ticketCancelled", handleTicketUpdated);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleMessageNew);
      socket.off("ticket:updated", handleTicketUpdated);
      socket.off("ticket:statusUpdated", handleTicketUpdated);
      socket.off("ticketAssigned", handleTicketUpdated);
      socket.off("ticketReleased", handleTicketUpdated);
      socket.off("ticketCancelled", handleTicketUpdated);
    };
  }, [refreshTickets]);

  const value = useMemo<ChatContextValue>(
    () => ({
      ...state,
      isLoadingTickets,
      isLoadingMessages,
      isSending,
      error,
      setIsOpen: (value) => setState((prev) => ({ ...prev, isOpen: value })),
      toggleOpen: () =>
        setState((prev) => ({
          ...prev,
          isOpen: !prev.isOpen,
        })),
      selectTicket,
      refreshTickets,
      refreshMessages,
      sendMessage,
    }),
    [
      state,
      isLoadingTickets,
      isLoadingMessages,
      isSending,
      error,
      selectTicket,
      refreshTickets,
      refreshMessages,
      sendMessage,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat debe usarse dentro de ChatProvider");
  }

  return context;
}

