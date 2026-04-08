import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { TicketChat } from "../components/chat/TicketChat";
import { socket } from "../socket/socket";
import { useChat } from "../context/ChatContext";
import { devLog } from "../utils/devLog";

export function TicketChatPage() {
  const { id } = useParams();
  const { selectTicket, selectedTicketId, refreshTickets, refreshMessages, resetUnread } = useChat();

  useEffect(() => {
    document.body.classList.add("hide-ticket-floating-chat");
    return () => {
      document.body.classList.remove("hide-ticket-floating-chat");
    };
  }, []);

  useEffect(() => {
    if (!id || !id.trim()) return;

    if (!selectedTicketId) {
      devLog("Resync desde URL:", id);
      selectTicket(id);
      resetUnread(id);
    }
  }, [id, resetUnread, selectedTicketId, selectTicket]);

  useEffect(() => {
    if (!id || !id.trim()) return;
    resetUnread(id);
  }, [id, resetUnread]);

  useEffect(() => {
    const handleReconnect = async () => {
      devLog("Re-fetch tras reconexion");
      await refreshTickets();

      if (selectedTicketId && selectedTicketId.trim()) {
        await refreshMessages(selectedTicketId);
      }
    };

    socket.on("connect", handleReconnect);
    return () => socket.off("connect", handleReconnect);
  }, [refreshMessages, refreshTickets, selectedTicketId]);

  return (
    <div className="min-h-screen bg-background">
      <Header showLogout />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <TicketChat mode="page" defaultTicketId={id || null} />
      </main>
    </div>
  );
}

export default TicketChatPage;

