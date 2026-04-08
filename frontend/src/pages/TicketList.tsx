import { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "../components/Header";
import { TicketList as DashboardTicketList } from "../components/dashboard/TicketList";
import { socket } from "../socket/socket";
import { getTickets } from "../services/ticket.service";
import { useAuth } from "../hooks/useAuth";
import { devLog } from "../utils/devLog";
import type { Ticket } from "../types";

export function TicketList() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTickets();
      setTickets(data);
    } catch {
      setError("No se pudieron cargar los tickets.");
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    const handleRefresh = async () => {
      devLog("Recarga de tickets por evento socket");
      await fetchTickets();
    };

    // Escuchar eventos para mantener la lista actualizada en tiempo real
    socket.on("connect", handleRefresh);
    socket.on("ticketCreated", handleRefresh);
    socket.on("ticketAssigned", handleRefresh);
    socket.on("ticketResolved", handleRefresh);
    socket.on("ticketCancelled", handleRefresh);
    socket.on("ticket:new", handleRefresh);
    socket.on("ticket:assigned", handleRefresh);
    socket.on("ticket:statusUpdated", handleRefresh);

    return () => {
      socket.off("connect", handleRefresh);
      socket.off("ticketCreated", handleRefresh);
      socket.off("ticketAssigned", handleRefresh);
      socket.off("ticketResolved", handleRefresh);
      socket.off("ticketCancelled", handleRefresh);
      socket.off("ticket:new", handleRefresh);
      socket.off("ticket:assigned", handleRefresh);
      socket.off("ticket:statusUpdated", handleRefresh);
    };
  }, [fetchTickets]);

  const viewerRole = useMemo<"client" | "technician" | undefined>(() => {
    if (user?.role === "client" || user?.role === "technician") {
      return user.role;
    }
    return undefined;
  }, [user?.role]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showLogout />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Todos los tickets</h1>
          <p className="mt-1 text-sm text-slate-500">
            Listado general de tickets visibles para tu usuario.
          </p>
        </div>

        <DashboardTicketList
          tickets={tickets}
          isLoading={isLoading}
          error={error}
          emptyTitle="No hay tickets disponibles"
          emptyDescription="Cuando existan tickets, apareceran aqui."
          showViewDetails
          viewerRole={viewerRole}
        />
      </main>
    </div>
  );
}
