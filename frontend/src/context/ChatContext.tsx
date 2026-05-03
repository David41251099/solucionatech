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
  unreadCounts: Record<string, number>;
  totalUnread: number;
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
  incrementUnread: (ticketId: string, senderId?: string | null) => void;
  resetUnread: (ticketId: string | null) => void;
  calculateTotalUnread: () => number;
  refreshTickets: () => Promise<void>;
  refreshMessages: (ticketId: string) => Promise<void>;
  sendMessage: (payload: SendMessagePayload) => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);
const CHAT_UNREAD_STORAGE_KEY = "chat_unread";
const calculateUnreadTotal = (counts: Record<string, number>) =>
  Object.values(counts).reduce((sum, count) => sum + (Number.isFinite(count) ? count : 0), 0);
const normalizeId = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : null;
};
const toShortId = (value: unknown) => {
  const normalized = normalizeId(value);
  return normalized ? normalized.slice(0, 8) : null;
};
const formDataHasContent = (formData?: FormData) => {
  if (!formData) return false;

  const messageValue = formData.get("message");
  if (typeof messageValue === "string" && messageValue.trim()) {
    return true;
  }

  return formData.get("file") instanceof File;
};
const getInitialUnread = () => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return { unreadCounts: {}, totalUnread: 0 };
    }

    const stored = window.localStorage.getItem(CHAT_UNREAD_STORAGE_KEY);
    if (!stored) {
      return { unreadCounts: {}, totalUnread: 0 };
    }

    const parsed = JSON.parse(stored) as {
      unreadCounts?: Record<string, unknown>;
      totalUnread?: unknown;
    };

    const unreadCounts = Object.entries(parsed?.unreadCounts ?? {}).reduce<Record<string, number>>(
      (acc, [ticketId, value]) => {
        const normalizedTicketId = normalizeId(ticketId);
        const count = Number(value);
        if (!normalizedTicketId || !Number.isFinite(count) || count <= 0) {
          return acc;
        }
        acc[normalizedTicketId] = Math.floor(count);
        return acc;
      },
      {}
    );

    const computedTotalUnread = calculateUnreadTotal(unreadCounts);
    const storedTotalUnread = Number(parsed?.totalUnread);
    const totalUnread = Number.isFinite(storedTotalUnread) && storedTotalUnread >= 0
      ? Math.floor(storedTotalUnread)
      : computedTotalUnread;

    return {
      unreadCounts,
      totalUnread: totalUnread > 0 ? totalUnread : computedTotalUnread,
    };
  } catch {
    return { unreadCounts: {}, totalUnread: 0 };
  }
};

const sortByDateAsc = (items: Message[]) =>
  [...items].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [state, setState] = useState<ChatState>(() => {
    const initialUnread = getInitialUnread();
    return {
      isOpen: false,
      selectedTicketId: null,
      tickets: [],
      messages: {},
      unreadCounts: initialUnread.unreadCounts,
      totalUnread: initialUnread.totalUnread,
    };
  });
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeTicketRef = useRef<string | null>(null);
  const processedRealtimeMessageIdsRef = useRef<Set<string>>(new Set());
  const joinedTicketRoomsRef = useRef<Set<string>>(new Set());

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
      devWarn("Ticket invalido en selectTicket:", ticketId);
      return;
    }

    const ticketIdNorm = normalizeId(ticketId);
    devLog("SETTING selectedTicketId:", ticketIdNorm);
    setError(null);
    setState((prev) => {
      if (!ticketIdNorm) {
        return { ...prev, selectedTicketId: null };
      }

      const currentUnread = prev.unreadCounts[ticketIdNorm] ?? 0;
      if (currentUnread <= 0) {
        return { ...prev, selectedTicketId: ticketIdNorm };
      }

      const unreadCounts = { ...prev.unreadCounts, [ticketIdNorm]: 0 };
      return {
        ...prev,
        selectedTicketId: ticketIdNorm,
        unreadCounts,
        totalUnread: calculateUnreadTotal(unreadCounts),
      };
    });
  }, []);

  const incrementUnread = useCallback(
    (ticketId: string, senderId?: string | null) => {
      const ticketIdNorm = normalizeId(ticketId);
      const senderIdNorm = normalizeId(senderId);
      const currentUserIdNorm = normalizeId(user?.id ?? (user as { userId?: string | null } | null)?.userId ?? null);
      if (!ticketIdNorm || !currentUserIdNorm) return;
      if (senderIdNorm && senderIdNorm === currentUserIdNorm) return;

      setState((prev) => {
        devLog("UNREAD BEFORE INCREMENT", {
          ticketId: ticketIdNorm,
          activeTicketId: normalizeId(prev.selectedTicketId),
          prevUnread: prev.unreadCounts[ticketIdNorm] ?? 0,
          prevTotalUnread: prev.totalUnread,
        });

        const unreadCounts = {
          ...prev.unreadCounts,
          [ticketIdNorm]: (prev.unreadCounts[ticketIdNorm] ?? 0) + 1,
        };
        const nextTotalUnread = calculateUnreadTotal(unreadCounts);

        devLog("UNREAD AFTER INCREMENT", {
          ticketId: ticketIdNorm,
          nextUnread: unreadCounts[ticketIdNorm],
          nextTotalUnread,
        });

        return {
          ...prev,
          unreadCounts,
          totalUnread: nextTotalUnread,
        };
      });
    },
    [user]
  );

  const resetUnread = useCallback((ticketId: string | null) => {
    const ticketIdNorm = normalizeId(ticketId);
    if (!ticketIdNorm) return;

    setState((prev) => {
      const currentUnread = prev.unreadCounts[ticketIdNorm] ?? 0;
      if (currentUnread <= 0) {
        return prev;
      }

      const unreadCounts = { ...prev.unreadCounts, [ticketIdNorm]: 0 };
      return {
        ...prev,
        unreadCounts,
        totalUnread: calculateUnreadTotal(unreadCounts),
      };
    });
  }, []);

  const calculateTotalUnread = useCallback(() => {
    return calculateUnreadTotal(state.unreadCounts);
  }, [state.unreadCounts]);

  useEffect(() => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;

      if (isAuthLoading) {
        return;
      }

      if (!isAuthenticated) {
        window.localStorage.removeItem(CHAT_UNREAD_STORAGE_KEY);
        return;
      }

      window.localStorage.setItem(
        CHAT_UNREAD_STORAGE_KEY,
        JSON.stringify({
          unreadCounts: state.unreadCounts,
          totalUnread: state.totalUnread,
        })
      );
    } catch {
      // noop: no bloquear UI si falla localStorage
    }
  }, [isAuthLoading, isAuthenticated, state.unreadCounts, state.totalUnread]);

  const sendMessage = useCallback(
    async ({ message, file, formData }: SendMessagePayload) => {
      const ticketId = state.selectedTicketId;
      if (!ticketId || !user?.id) return;

      const trimmed = message?.trim() ?? "";
      const hasAttachedFile = !!file || formData?.get("file") instanceof File;
      if (!trimmed && !hasAttachedFile && !formDataHasContent(formData)) return;

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
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      setState({
        isOpen: false,
        selectedTicketId: null,
        tickets: [],
        messages: {},
        unreadCounts: {},
        totalUnread: 0,
      });
      return;
    }

    refreshTickets();
  }, [isAuthLoading, isAuthenticated, refreshTickets]);

  useEffect(() => {
    if (!isAuthenticated) {
      joinedTicketRoomsRef.current.clear();
      return;
    }

    const nextTicketIds = new Set(
      state.tickets
        .map((ticket) => normalizeId(ticket.id))
        .filter((id): id is string => Boolean(id))
    );

    const joinedTicketIds = joinedTicketRoomsRef.current;

    nextTicketIds.forEach((ticketId) => {
      if (joinedTicketIds.has(ticketId)) return;

      socket.emit(SOCKET_EVENTS.TICKET_JOIN, { ticketId }, (ack?: SocketAck) => {
        if (ack && ack.success === false) {
          devWarn("ticket:join rechazado en sync de rooms:", { ticketId, reason: ack.message });
          return;
        }
        joinedTicketIds.add(ticketId);
      });
    });

    [...joinedTicketIds].forEach((ticketId) => {
      if (nextTicketIds.has(ticketId)) return;

      socket.emit(SOCKET_EVENTS.TICKET_LEAVE, { ticketId }, (ack?: SocketAck) => {
        if (ack && ack.success === false) {
          devWarn("ticket:leave rechazado en sync de rooms:", { ticketId, reason: ack.message });
          return;
        }
        joinedTicketIds.delete(ticketId);
      });
    });
  }, [isAuthenticated, state.tickets]);

  useEffect(() => {
    return () => {
      const joinedTicketIds = [...joinedTicketRoomsRef.current];
      joinedTicketIds.forEach((ticketId) => {
        socket.emit(SOCKET_EVENTS.TICKET_LEAVE, { ticketId });
      });
      joinedTicketRoomsRef.current.clear();
    };
  }, []);

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
      devLog("Rejoin automatico:", activeTicketId);

      socket.emit(
        SOCKET_EVENTS.TICKET_JOIN,
        { ticketId: activeTicketId },
        (ack?: SocketAck) => {
          if (ack && ack.success === false) {
            devWarn("Rejoin fallo:", ack.message);
            activeTicketRef.current = null;
            setError(ack.message || "No se pudo restablecer el chat tras reconexion.");
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
    const handleMessageNew = (message: Message | { message?: Message } | { data?: { message?: Message } } | Message[]) => {
      const incomingArray = Array.isArray(message) ? message : null;
      const incomingEnvelope = (!incomingArray ? message : null) as { message?: Message; data?: { message?: Message } };
      const rawMessage = ((): Message | null => {
        if (incomingArray && incomingArray.length > 0) {
          return incomingArray[0] as Message;
        }
        if (incomingEnvelope?.data?.message && typeof incomingEnvelope.data.message === "object") {
          return incomingEnvelope.data.message;
        }
        if (incomingEnvelope?.message && typeof incomingEnvelope.message === "object") {
          return incomingEnvelope.message;
        }
        if (message && typeof message === "object") {
          return message as Message;
        }
        return null;
      })();
      if (!rawMessage) {
        return;
      }
      const normalizedSocketMessage = rawMessage as Message & {
        ticketId?: string | number | null;
        senderId?: string | number | null;
        userId?: string | number | null;
      };
      const incomingTicketId = normalizedSocketMessage.ticket_id ?? normalizedSocketMessage.ticketId;
      const senderId =
        normalizedSocketMessage.senderId ??
        normalizedSocketMessage.userId ??
        normalizedSocketMessage.sender_id;
      const activeTicketId = state.selectedTicketId;
      const currentUserId = user?.id ?? (user as { userId?: string | null } | null)?.userId ?? null;

      const incomingTicketIdNorm = normalizeId(incomingTicketId);
      const activeTicketIdNorm = normalizeId(activeTicketId);
      const senderIdNorm = normalizeId(senderId);
      const currentUserIdNorm = normalizeId(currentUserId);
      const messageIdNorm = normalizeId(rawMessage?.id);
      const incomingShortId = toShortId(incomingTicketIdNorm);
      const matchedByFullId = state.tickets.find(
        (ticket) => normalizeId(ticket.id) === incomingTicketIdNorm
      );
      const matchedByShortId =
        !matchedByFullId && incomingShortId
          ? state.tickets.find((ticket) => toShortId(ticket.id) === incomingShortId)
          : null;
      const matchedTicketId = matchedByFullId?.id ?? matchedByShortId?.id ?? incomingTicketIdNorm;
      const matchedTicketIdNorm = normalizeId(matchedTicketId);

      const isOwnMessage = senderIdNorm === currentUserIdNorm;
      const isActiveTicket = matchedTicketIdNorm === activeTicketIdNorm && state.isOpen;

      devLog("UNREAD ID COMPARE", {
        rawIncomingTicketId: incomingTicketId,
        normalizedIncomingTicketId: incomingTicketIdNorm,
        matchedTicketId,
        matchedTicketIdNorm,
        rawActiveTicketId: activeTicketId,
        normalizedActiveTicketId: activeTicketIdNorm,
      });

      devLog("UNREAD DEBUG", {
        incomingTicketId: incomingTicketIdNorm,
        activeTicketId: activeTicketIdNorm,
        isChatOpen: state.isOpen,
        senderId: senderIdNorm,
        currentUserId: currentUserIdNorm,
        isOwnMessage,
        isActiveTicket,
        willIncrement: !isOwnMessage && !isActiveTicket,
      });

      if (!incomingTicketIdNorm) {
        return;
      }

      if (messageIdNorm && processedRealtimeMessageIdsRef.current.has(messageIdNorm)) {
        return;
      }
      if (messageIdNorm) {
        processedRealtimeMessageIdsRef.current.add(messageIdNorm);
      }

      setState((prev) => {
        const key = matchedTicketIdNorm || incomingTicketIdNorm;
        if (!key) return prev;
        const current = prev.messages[key] ?? [];
        if (current.some((item) => item.id === rawMessage?.id)) return prev;

        const normalizedMessage = {
          ...rawMessage,
          ticket_id: key,
          sender_id: senderIdNorm ?? rawMessage?.sender_id ?? null,
        };

        return {
          ...prev,
          messages: {
            ...prev.messages,
            [key]: sortByDateAsc([...current, normalizedMessage]),
          },
        };
      });

      if (isOwnMessage) return;
      if (isActiveTicket) return;

      if (!matchedTicketIdNorm) return;
      incrementUnread(matchedTicketIdNorm, senderIdNorm);
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
  }, [incrementUnread, refreshTickets, state.isOpen, state.selectedTicketId, state.tickets, user]);

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
      incrementUnread,
      resetUnread,
      calculateTotalUnread,
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
      incrementUnread,
      resetUnread,
      calculateTotalUnread,
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

