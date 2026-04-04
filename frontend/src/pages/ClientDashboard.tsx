import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, History, Plus } from "lucide-react";
import { toast } from "sonner";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { DashboardTabs } from "../components/dashboard/DashboardTabs";
import { TicketList } from "../components/dashboard/TicketList";
import { HistoryList } from "../components/dashboard/HistoryList";
import { getTicketsByStatus } from "../services/ticket.service";
import { socket } from "../socket/socket";
import { useAuth } from "../hooks/useAuth";
import type { Ticket } from "../types";
import { devLog, devWarn } from "../utils/devLog";

export function ClientDashboard() {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const LIMIT_ACTIVE = 20;
  const LIMIT_HISTORY = 50;
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [historyTickets, setHistoryTickets] = useState<Ticket[]>([]);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"requests" | "history">("requests");

  const loadActiveTickets = useCallback(async () => {
    try {
      setError(null);
      const data = await getTicketsByStatus(["pending", "assigned", "in_progress"], LIMIT_ACTIVE, 0);
      setActiveTickets(data);
    } catch {
      setError("No se pudieron cargar tus tickets.");
    }
  }, []);

  const loadHistoryTickets = useCallback(
    async (offset = 0, append = false) => {
      if (append) {
        setIsLoadingMoreHistory(true);
      }

      const data = await getTicketsByStatus(["resolved", "cancelled"], LIMIT_HISTORY, offset);
      setHistoryHasMore(data.length === LIMIT_HISTORY);
      setHistoryTickets((prev) => (append ? [...prev, ...data] : data));
      setIsLoadingMoreHistory(false);
    },
    []
  );

  const resetHistory = useCallback(async () => {
    setHistoryOffset(0);
    await loadHistoryTickets(0, false);
  }, [loadHistoryTickets]);

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      setHistoryOffset(0);
      await Promise.all([loadActiveTickets(), loadHistoryTickets(0, false)]);
    } catch {
      setError("No se pudieron cargar tus tickets.");
    } finally {
      setIsLoading(false);
    }
  }, [loadActiveTickets, loadHistoryTickets]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const handleReconnect = async () => {
      devLog("Dashboard re-fetch tras reconexión");
      setHistoryOffset(0);
      setError(null);
      const results = await Promise.allSettled([
        loadActiveTickets(),
        loadHistoryTickets(0, false),
      ]);
      const hasError = results.some((result) => result.status === "rejected");
      if (hasError) {
        devWarn("Error parcial en reconnect de ClientDashboard", results);
        setError("No se pudieron cargar tus tickets.");
      }
    };

    socket.on("connect", handleReconnect);
    return () => {
      socket.off("connect", handleReconnect);
    };
  }, [loadActiveTickets, loadHistoryTickets]);

  useEffect(() => {
    const getPayload = (payload?: Ticket | { ticket: Ticket; actorId?: string }) => {
      if (!payload) return { ticket: undefined, actorId: undefined };
      if ("ticket" in payload) return payload;
      return { ticket: payload, actorId: undefined };
    };

    const reloadAll = () => {
      loadActiveTickets();
      resetHistory();
    };

    const handleAssigned = (payload?: Ticket | { ticket: Ticket; actorId?: string }) => {
      reloadAll();
      const { ticket, actorId } = getPayload(payload);
      if (!ticket || ticket.client_id !== currentUserId) return;
      if (actorId && actorId === currentUserId) return;
      toast.success("Un técnico aceptó tu solicitud.");
    };

    const handleResolved = (payload?: Ticket | { ticket: Ticket; actorId?: string }) => {
      reloadAll();
      const { ticket, actorId } = getPayload(payload);
      if (!ticket || ticket.client_id !== currentUserId) return;
      if (actorId && actorId === currentUserId) return;
      toast.success("Tu ticket fue resuelto.");
    };

    const handleCancelled = (payload?: Ticket | { ticket: Ticket; actorId?: string }) => {
      reloadAll();
      const { ticket, actorId } = getPayload(payload);
      if (!ticket || ticket.client_id !== currentUserId) return;
      if (actorId && actorId === currentUserId) return;
      toast.success("Tu ticket fue cancelado.");
    };

    const handleStatusUpdated = () => reloadAll();

    socket.on("ticket:statusUpdated", handleStatusUpdated);
    socket.on("ticketResolved", handleResolved);
    socket.on("ticket:cancelled", handleStatusUpdated);
    socket.on("ticketCancelled", handleCancelled);
    socket.on("ticket:released", handleStatusUpdated);
    socket.on("ticketReleased", handleStatusUpdated);
    socket.on("ticketCreated", handleStatusUpdated);
    socket.on("ticketAssigned", handleAssigned);

    return () => {
      socket.off("ticket:statusUpdated", handleStatusUpdated);
      socket.off("ticketResolved", handleResolved);
      socket.off("ticket:cancelled", handleStatusUpdated);
      socket.off("ticketCancelled", handleCancelled);
      socket.off("ticket:released", handleStatusUpdated);
      socket.off("ticketReleased", handleStatusUpdated);
      socket.off("ticketCreated", handleStatusUpdated);
      socket.off("ticketAssigned", handleAssigned);
    };
  }, [currentUserId, loadActiveTickets, resetHistory]);

  const tabs = useMemo(
    () => [
      { id: "requests", label: "Solicitudes", icon: <ClipboardList className="h-5 w-5" /> },
      { id: "history", label: "Historial", icon: <History className="h-5 w-5" /> },
    ],
    []
  );

  const handleLoadMoreHistory = async () => {
    const nextOffset = historyOffset + LIMIT_HISTORY;
    setHistoryOffset(nextOffset);
    await loadHistoryTickets(nextOffset, true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showLogout />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard del Cliente</h1>
            <p className="mt-1 text-sm text-slate-500">Gestiona tus solicitudes activas y tu historial personal.</p>
          </div>
          <Button asChild className="flex items-center gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            <Link to="/client/create-ticket">
              <Plus className="h-4 w-4" />
              Crear Ticket
            </Link>
          </Button>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <DashboardTabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as "requests" | "history")} />
          <div className="text-sm text-slate-500">
            {activeTab === "requests" ? `${activeTickets.length} activas` : `${historyTickets.length} finalizadas`}
          </div>
        </div>

        {activeTab === "requests" ? (
          <TicketList
            tickets={activeTickets}
            isLoading={isLoading}
            error={error}
            emptyTitle="No tienes solicitudes activas"
            emptyDescription="Crea un nuevo ticket para recibir soporte"
            showViewDetails
            viewerRole="client"
          />
        ) : (
          <HistoryList
            tickets={historyTickets}
            isLoading={isLoading}
            error={error}
            emptyTitle="Tu historial aún está vacío"
            emptyDescription="Aquí verás tus tickets resueltos o cancelados"
            viewerRole="client"
            footer={
              <div className="space-y-3">
                {historyHasMore && (
                  <div className="flex justify-center">
                    <Button type="button" variant="outline" onClick={handleLoadMoreHistory} disabled={isLoadingMoreHistory}>
                      {isLoadingMoreHistory ? "Cargando..." : "Ver más"}
                    </Button>
                  </div>
                )}
                {!historyHasMore && historyTickets.length > 0 && (
                  <p className="text-center text-sm text-slate-500">No hay más resultados.</p>
                )}
              </div>
            }
          />
        )}
      </main>
    </div>
  );
}

