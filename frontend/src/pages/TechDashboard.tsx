import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Clock3, History, Inbox, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { assignTicket, getAvailableTickets, getMyTickets } from "../services/ticket.service";
import { socket } from "../socket/socket";
import { useAuth } from "@/hooks/useAuth";
import type { Ticket } from "../types";
import { TicketList } from "../components/dashboard/TicketList";
import { HistoryList } from "../components/dashboard/HistoryList";
import { DashboardTabs } from "../components/dashboard/DashboardTabs";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { StatCard } from "../components/dashboard/StatCard";
import { SectionContainer } from "../components/dashboard/SectionContainer";
import { devLog, devWarn } from "../utils/devLog";
import { pushRealtimeDebug } from "../utils/realtimeDebug";

export function TechDashboard() {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const LIMIT_AVAILABLE = 20;
  const LIMIT_MY = 20;
  const LIMIT_HISTORY = 50;
  const [availableTickets, setAvailableTickets] = useState<Ticket[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [historyTickets, setHistoryTickets] = useState<Ticket[]>([]);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTakingId, setIsTakingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"available" | "my" | "history">("available");

  const loadAvailableTickets = useCallback(async () => {
    try {
      pushRealtimeDebug("tech-dashboard", "Refetch tickets disponibles");
      const available = await getAvailableTickets(LIMIT_AVAILABLE, 0);
      setAvailableTickets(available);
      setError(null);
    } catch (err) {
      throw err;
    }
  }, []);

  const loadMyTickets = useCallback(async () => {
    try {
      pushRealtimeDebug("tech-dashboard", "Refetch mis tickets");
      const mine = await getMyTickets(LIMIT_MY, 0);
      setMyTickets(mine);
      setError(null);
    } catch (err) {
      throw err;
    }
  }, []);

  const loadHistoryTickets = useCallback(
    async (offset = 0, append = false) => {
      try {
        if (append) {
          setIsLoadingMoreHistory(true);
        }

        pushRealtimeDebug("tech-dashboard", "Refetch historial", { offset, append });
        const history = await getMyTickets(LIMIT_HISTORY, offset, ["resolved", "cancelled"]);
        setHistoryHasMore(history.length === LIMIT_HISTORY);
        setHistoryTickets((prev) => (append ? [...prev, ...history] : history));
        setError(null);
      } catch (err) {
        throw err;
      } finally {
        if (append) {
          setIsLoadingMoreHistory(false);
        }
      }
    },
    []
  );

  const resetHistory = useCallback(async () => {
    setHistoryOffset(0);
    await loadHistoryTickets(0, false);
  }, [loadHistoryTickets]);

  const loadAll = useCallback(async () => {
    setError(null);
    setHistoryOffset(0);
    const results = await Promise.allSettled([
      loadAvailableTickets(),
      loadMyTickets(),
      loadHistoryTickets(0, false),
    ]);

    const hasError = results.some((result) => result.status === "rejected");
    if (hasError) {
      devWarn("Error parcial en loadAll de TechDashboard", results);
      setError("No se pudieron cargar los tickets.");
    }
    setIsLoading(false);
  }, [loadAvailableTickets, loadHistoryTickets, loadMyTickets]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const handleReconnect = async () => {
      devLog("Dashboard re-fetch tras reconexion");
      setError(null);
      setHistoryOffset(0);
      const results = await Promise.allSettled([
        loadAvailableTickets(),
        loadMyTickets(),
        loadHistoryTickets(0, false),
      ]);
      const hasError = results.some((result) => result.status === "rejected");
      if (hasError) {
        devWarn("Error parcial en reconnect de TechDashboard", results);
        setError("No se pudieron cargar los tickets.");
      }
    };

    socket.on("connect", handleReconnect);
    return () => {
      socket.off("connect", handleReconnect);
    };
  }, [loadAvailableTickets, loadHistoryTickets, loadMyTickets]);

  useEffect(() => {
    const getPayload = (payload?: Ticket | { ticket: Ticket; actorId?: string }) => {
      if (!payload) return { ticket: undefined, actorId: undefined };
      if ("ticket" in payload) return payload;
      return { ticket: payload, actorId: undefined };
    };

    const handleNew = (payload?: Ticket) => {
      pushRealtimeDebug("tech-dashboard:event", "ticket:new recibido", payload);
      loadAvailableTickets();
    };

    const handleCreated = (payload?: Ticket | { ticket: Ticket; actorId?: string }) => {
      pushRealtimeDebug("tech-dashboard:event", "ticketCreated recibido", payload);
      loadAvailableTickets();
      const { ticket, actorId } = getPayload(payload);
      if (!ticket) return;
      if (actorId && actorId === currentUserId) return;
      if (ticket.technician_id === currentUserId) return;
      toast("Nuevo ticket disponible.");
    };

    const handleAssigned = (payload?: Ticket | { ticket: Ticket; actorId?: string }) => {
      pushRealtimeDebug("tech-dashboard:event", "ticketAssigned/ticket:assigned recibido", payload);
      loadAvailableTickets();
      loadMyTickets();
      resetHistory();
    };

    const handleStatusUpdated = (payload?: Ticket) => {
      pushRealtimeDebug("tech-dashboard:event", "ticket:statusUpdated/ticketResolved recibido", payload);
      loadMyTickets();
      resetHistory();
    };

    const handleCancelled = (payload?: Ticket | { ticket: Ticket; actorId?: string }) => {
      pushRealtimeDebug("tech-dashboard:event", "ticketCancelled recibido", payload);
      loadAvailableTickets();
      loadMyTickets();
      resetHistory();

      const { ticket, actorId } = getPayload(payload);
      if (!ticket) return;
      if (ticket.status !== "cancelled") return;
      if (!ticket.technician_id) return;
      if (ticket.technician_id !== currentUserId) return;
      if (actorId && actorId === currentUserId) return;

      toast("El cliente cancelo un ticket asignado.");
    };

    socket.on("ticket:new", handleNew);
    socket.on("ticketCreated", handleCreated);
    socket.on("ticket:assigned", handleAssigned);
    socket.on("ticketAssigned", handleAssigned);
    socket.on("ticket:statusUpdated", handleStatusUpdated);
    socket.on("ticketResolved", handleStatusUpdated);
    socket.on("ticket:cancelled", handleAssigned);
    socket.on("ticketCancelled", handleCancelled);
    socket.on("ticket:released", handleAssigned);
    socket.on("ticketReleased", handleAssigned);

    return () => {
      socket.off("ticket:new", handleNew);
      socket.off("ticketCreated", handleCreated);
      socket.off("ticket:assigned", handleAssigned);
      socket.off("ticketAssigned", handleAssigned);
      socket.off("ticket:statusUpdated", handleStatusUpdated);
      socket.off("ticketResolved", handleStatusUpdated);
      socket.off("ticket:cancelled", handleAssigned);
      socket.off("ticketCancelled", handleCancelled);
      socket.off("ticket:released", handleAssigned);
      socket.off("ticketReleased", handleAssigned);
    };
  }, [currentUserId, loadAvailableTickets, loadMyTickets, resetHistory]);

  const available = useMemo(() => availableTickets.filter((ticket) => ticket.status === "pending"), [availableTickets]);

  const myActiveTickets = useMemo(
    () => myTickets.filter((ticket) => ticket.status === "assigned" || ticket.status === "in_progress"),
    [myTickets]
  );

  const inProgressCount = useMemo(
    () => myTickets.filter((ticket) => ticket.status === "in_progress").length,
    [myTickets]
  );

  const tabs = useMemo(
    () => [
      { id: "available", label: "Disponibles", icon: <Inbox className="h-5 w-5" /> },
      { id: "my", label: `Mis tickets (${myActiveTickets.length})`, icon: <ClipboardList className="h-5 w-5" /> },
      { id: "history", label: "Historial", icon: <History className="h-5 w-5" /> },
    ],
    [myActiveTickets.length]
  );

  const handleTakeTicket = async (ticketId: string) => {
    try {
      setIsTakingId(ticketId);
      await assignTicket(ticketId);
      await loadAvailableTickets();
      await loadMyTickets();
      await resetHistory();
      toast.success("Ticket tomado correctamente.");
    } catch {
      setError("No se pudo tomar el ticket. Intenta nuevamente.");
      toast.error("No se pudo tomar el ticket.");
    } finally {
      setIsTakingId(null);
    }
  };

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
              Monitorea tickets asignados, progreso de soporte y disponibilidad en tiempo real.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => setActiveTab("available")}
          >
            Ver disponibles
          </Button>
        </div>

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tickets asignados" value={myActiveTickets.length} icon={<ClipboardList className="h-4 w-4" />} tone="blue" />
          <StatCard label="En proceso" value={inProgressCount} icon={<LoaderCircle className="h-4 w-4" />} tone="orange" />
          <StatCard label="Disponibles" value={available.length} icon={<Inbox className="h-4 w-4" />} tone="amber" />
          <StatCard label="Resueltos" value={historyTickets.filter((t) => t.status === "resolved").length} icon={<CheckCircle2 className="h-4 w-4" />} tone="green" />
        </section>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <DashboardTabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as "available" | "my" | "history")} />
          <p className="text-sm text-slate-500">
            {activeTab === "available" && `${available.length} disponibles`}
            {activeTab === "my" && `${myActiveTickets.length} activos`}
            {activeTab === "history" && `${historyTickets.length} en historial`}
          </p>
        </div>

        {activeTab === "available" && (
          <SectionContainer
            title="Tickets disponibles"
            subtitle="Solicitudes pendientes que puedes tomar ahora."
          >
            <TicketList
              tickets={available}
              isLoading={isLoading}
              error={error}
              emptyTitle="No hay tickets disponibles"
              emptyDescription="Vuelve mas tarde para nuevas solicitudes."
              onTakeTicket={handleTakeTicket}
              takingId={isTakingId}
              viewerRole="technician"
            />
          </SectionContainer>
        )}

        {activeTab === "my" && (
          <SectionContainer
            title="Tickets activos"
            subtitle="Tickets asignados al tecnico autenticado."
          >
            <TicketList
              tickets={myActiveTickets}
              isLoading={isLoading}
              error={error}
              emptyTitle="No tienes tickets asignados"
              emptyDescription="Cuando tomes un ticket, aparecera en esta seccion."
              showViewDetails
              viewerRole="technician"
            />
          </SectionContainer>
        )}

        {activeTab === "history" && (
          <SectionContainer
            title="Historial"
            subtitle="Tickets cerrados por tu cuenta."
          >
            <HistoryList
              tickets={historyTickets}
              isLoading={isLoading}
              error={error}
              emptyTitle="Aun no tienes historial"
              emptyDescription="Los tickets resueltos o cancelados apareceran aqui."
              viewerRole="technician"
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
