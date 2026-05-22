import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ClipboardList, Clock3, History, LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { TicketList } from "../components/dashboard/TicketList";
import { HistoryList } from "../components/dashboard/HistoryList";
import { DashboardTabs } from "../components/dashboard/DashboardTabs";
import { StatCard } from "../components/dashboard/StatCard";
import { SectionContainer } from "../components/dashboard/SectionContainer";
import { getTicketsByStatus } from "../services/ticket.service";
import { socket } from "../socket/socket";
import { useAuth } from "../hooks/useAuth";
import type { Ticket } from "../types";
import { devLog, devWarn } from "../utils/devLog";
import { pushRealtimeDebug } from "../utils/realtimeDebug";

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
      pushRealtimeDebug("client-dashboard", "Refetch tickets activos");
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

      pushRealtimeDebug("client-dashboard", "Refetch historial", { offset, append });
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
      devLog("Dashboard re-fetch tras reconexion");
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
      pushRealtimeDebug("client-dashboard:event", "ticketAssigned recibido", payload);
      reloadAll();
      const { ticket, actorId } = getPayload(payload);
      if (!ticket || ticket.client_id !== currentUserId) return;
      if (actorId && actorId === currentUserId) return;
      toast.success("Un tecnico acepto tu solicitud.");
    };

    const handleResolved = (payload?: Ticket | { ticket: Ticket; actorId?: string }) => {
      pushRealtimeDebug("client-dashboard:event", "ticketResolved recibido", payload);
      reloadAll();
      const { ticket, actorId } = getPayload(payload);
      if (!ticket || ticket.client_id !== currentUserId) return;
      if (actorId && actorId === currentUserId) return;
      toast.success("Tu ticket fue resuelto.");
    };

    const handleCancelled = (payload?: Ticket | { ticket: Ticket; actorId?: string }) => {
      pushRealtimeDebug("client-dashboard:event", "ticketCancelled recibido", payload);
      reloadAll();
      const { ticket, actorId } = getPayload(payload);
      if (!ticket || ticket.client_id !== currentUserId) return;
      if (actorId && actorId === currentUserId) return;
      toast.success("Tu ticket fue cancelado.");
    };

    const handleStatusUpdated = (payload?: Ticket) => {
      pushRealtimeDebug("client-dashboard:event", "ticket:statusUpdated recibido", payload);
      reloadAll();
    };

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

  const pendingCount = useMemo(
    () => activeTickets.filter((ticket) => ticket.status === "pending").length,
    [activeTickets]
  );
  const activeCount = activeTickets.length;
  const resolvedCount = useMemo(
    () => historyTickets.filter((ticket) => ticket.status === "resolved").length,
    [historyTickets]
  );
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
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="mt-2 text-sm text-slate-500">
              Gestiona tus tickets activos y revisa el historial de soporte en un solo lugar.
            </p>
          </div>
          <Button asChild className="flex items-center gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            <Link to="/client/create-ticket">
              <Plus className="h-4 w-4" />
              Crear ticket
            </Link>
          </Button>
        </div>

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tickets activos" value={activeCount} icon={<LoaderCircle className="h-4 w-4" />} tone="blue" />
          <StatCard label="Tickets pendientes" value={pendingCount} icon={<Clock3 className="h-4 w-4" />} tone="amber" />
          <StatCard label="Tickets resueltos" value={resolvedCount} icon={<CheckCircle2 className="h-4 w-4" />} tone="green" />
          <StatCard label="Historial total" value={historyTickets.length} icon={<Clock3 className="h-4 w-4" />} tone="neutral" />
        </section>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <DashboardTabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as "requests" | "history")} />
          <p className="text-sm text-slate-500">
            {activeTab === "requests" ? `${activeCount} activas` : `${historyTickets.length} en historial`}
          </p>
        </div>

        {activeTab === "requests" ? (
          <SectionContainer
            title="Tickets activos"
            subtitle="Solicitudes en estado pendiente, asignado o en progreso."
          >
            <TicketList
              tickets={activeTickets}
              isLoading={isLoading}
              error={error}
              emptyTitle="No tienes tickets activos"
              emptyDescription="Crea un nuevo ticket para comenzar una conversacion con soporte."
              showViewDetails
              viewerRole="client"
            />
          </SectionContainer>
        ) : (
          <SectionContainer
            title="Historial"
            subtitle="Tickets finalizados recientemente."
          >
            <HistoryList
              tickets={historyTickets}
              isLoading={isLoading}
              error={error}
              emptyTitle="Aun no has creado tickets"
              emptyDescription="Tus tickets resueltos o cancelados apareceran aqui."
              viewerRole="client"
              footer={
                <div className="space-y-3">
                  {historyHasMore && (
                    <div className="flex justify-center">
                      <Button type="button" variant="outline" onClick={handleLoadMoreHistory} disabled={isLoadingMoreHistory}>
                        {isLoadingMoreHistory ? "Cargando..." : "Ver mas"}
                      </Button>
                    </div>
                  )}
                  {!historyHasMore && historyTickets.length > 0 && (
                    <p className="text-center text-sm text-slate-500">No hay mas resultados.</p>
                  )}
                </div>
              }
            />
          </SectionContainer>
        )}
      </main>
    </div>
  );
}
