import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "../components/Header";
import { TicketListSidebar, type ChatTicketSummary } from "../components/chat/TicketListSidebar";
import { ChatWindow } from "../components/chat/ChatWindow";
import { useAuth } from "@/hooks/useAuth";
import { getMyTickets, getTicketMessages, getTicketsByStatus } from "../services/ticket.service";
import { socket } from "../socket/socket";
import type { Ticket, TicketMessage } from "../types";

const clientStatuses: Ticket["status"][] = ["pending", "assigned", "in_progress"];
const technicianStatuses: Ticket["status"][] = ["assigned", "in_progress"];

export function ChatPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<ChatTicketSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedTicketId = searchParams.get("ticket");
  const selectedItem = items.find((item) => item.ticket.id === selectedTicketId) ?? null;

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const loadTickets = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const tickets =
          user.role === "technician"
            ? await getMyTickets(undefined, undefined, technicianStatuses)
            : await getTicketsByStatus(clientStatuses);

        const summaries = await Promise.all(
          tickets.map(async (ticket) => {
            try {
              const messages = await getTicketMessages(ticket.id);
              const lastMessage = messages[messages.length - 1] ?? null;
              return { ticket, lastMessage };
            } catch {
              return { ticket, lastMessage: null };
            }
          })
        );

        if (!isMounted) return;

        setItems(summaries);
      } catch {
        if (!isMounted) return;
        setItems([]);
        setError("No se pudieron cargar los chats activos.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTickets();

    const handleMessageNew = (message: TicketMessage) => {
      setItems((prev) => {
        const exists = prev.some((item) => item.ticket.id === message.ticket_id);
        if (!exists) return prev;

        return prev.map((item) =>
          item.ticket.id === message.ticket_id
            ? { ...item, lastMessage: message }
            : item
        );
      });
    };

    const handleTicketRefresh = () => {
      loadTickets();
    };

    socket.on("message:new", handleMessageNew);
    socket.on("ticketCreated", handleTicketRefresh);
    socket.on("ticketAssigned", handleTicketRefresh);
    socket.on("ticket:statusUpdated", handleTicketRefresh);
    socket.on("ticketReleased", handleTicketRefresh);
    socket.on("ticketCancelled", handleTicketRefresh);
    socket.on("ticket:new", handleTicketRefresh);
    socket.on("ticket:assigned", handleTicketRefresh);
    socket.on("ticket:released", handleTicketRefresh);
    socket.on("ticket:cancelled", handleTicketRefresh);

    return () => {
      isMounted = false;
      socket.off("message:new", handleMessageNew);
      socket.off("ticketCreated", handleTicketRefresh);
      socket.off("ticketAssigned", handleTicketRefresh);
      socket.off("ticket:statusUpdated", handleTicketRefresh);
      socket.off("ticketReleased", handleTicketRefresh);
      socket.off("ticketCancelled", handleTicketRefresh);
      socket.off("ticket:new", handleTicketRefresh);
      socket.off("ticket:assigned", handleTicketRefresh);
      socket.off("ticket:released", handleTicketRefresh);
      socket.off("ticket:cancelled", handleTicketRefresh);
    };
  }, [user]);

  useEffect(() => {
    if (isLoading) return;

    const selectedExists = !!selectedTicketId && items.some((item) => item.ticket.id === selectedTicketId);

    if (selectedExists) return;

    if (!items.length) {
      setSearchParams({}, { replace: true });
      return;
    }

    setSearchParams({ ticket: items[0].ticket.id }, { replace: true });
  }, [isLoading, items, selectedTicketId, setSearchParams]);

  const handleSelect = (ticketId: string) => {
    setSearchParams({ ticket: ticketId });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showLogout />

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <div className="grid min-h-0 flex-1 grid-cols-1 bg-slate-100 md:grid-cols-[340px_minmax(0,1fr)]">
          <TicketListSidebar
            items={items}
            selectedTicketId={selectedTicketId}
            isLoading={isLoading}
            error={error}
            onSelect={handleSelect}
          />
          <ChatWindow ticket={selectedItem?.ticket} currentUserId={user?.id} />
        </div>
      </main>
    </div>
  );
}
