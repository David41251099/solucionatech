import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { TicketHeader } from "../components/ticket/TicketHeader";
import { TicketInfoCard } from "../components/ticket/TicketInfoCard";
import { TicketActivity } from "../components/ticket/TicketActivity";
import { ImagePreviewModal } from "../components/ui/ImagePreviewModal";
import { useAuth } from "../hooks/useAuth";
import { socket } from "../socket/socket";
import { toast } from "sonner";
import { acceptTicket, cancelTicket, getTicketById, releaseTicket, startTicketWork, updateTicketStatus } from "../services/ticket.service";
import { getAttachmentPaths, getFileUrl } from "../utils/files";
import { devLog } from "../utils/devLog";
import type { Ticket, TicketStatus } from "../types";

const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
  pending: [],
  assigned: [],
  in_progress: ["resolved"],
  resolved: [],
  cancelled: [],
};

export function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isStartingWork, setIsStartingWork] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadTicket = useCallback(async (ticketId?: string) => {
    if (!ticketId || !ticketId.trim()) {
      setError("Ticket no encontrado");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getTicketById(ticketId);
      setTicket(data);
    } catch {
      setError("No se pudo cargar el ticket.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTicket(id);
  }, [id, loadTicket]);

  useEffect(() => {
    const handleReconnect = async () => {
      devLog("Re-fetch tras reconexión");
      if (!id || !id.trim()) return;
      await loadTicket(id);
    };

    socket.on("connect", handleReconnect);
    return () => {
      socket.off("connect", handleReconnect);
    };
  }, [id, loadTicket]);

  const currentStatus = useMemo<TicketStatus>(() => {
    if (!ticket) return "pending";
    return ticket.status;
  }, [ticket]);

  const allowedOptions = allowedTransitions[currentStatus] ?? [];
  const isSelectDisabled = isUpdatingStatus || allowedOptions.length === 0;

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket || user?.role !== "technician") return;
    try {
      setIsUpdatingStatus(true);
      const updated = await updateTicketStatus(ticket.id, newStatus);
      setTicket(updated);
      toast.success("Estado actualizado");
    } catch {
      setError("No se pudo actualizar el estado del ticket.");
      toast.error("No se pudo actualizar el estado.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelTicket = async () => {
    if (!ticket) return;
    try {
      setIsCancelling(true);
      const updated = await cancelTicket(ticket.id);
      setTicket(updated);
      toast.success("Solicitud cancelada");
    } catch {
      setError("No se pudo cancelar el ticket.");
      toast.error("No se pudo cancelar la solicitud.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReleaseTicket = async () => {
    if (!ticket) return;
    try {
      setIsReleasing(true);
      const updated = await releaseTicket(ticket.id);
      setTicket(updated);
      toast.success("Ticket liberado");
    } catch {
      setError("No se pudo liberar el ticket.");
      toast.error("No se pudo liberar el ticket.");
    } finally {
      setIsReleasing(false);
    }
  };

  const handleAcceptTicket = async () => {
    if (!ticket) return;
    try {
      setIsAccepting(true);
      const updated = await acceptTicket(ticket.id);
      setTicket(updated);
      if (socket.connected) {
        socket.emit("ticketUpdated", { ticketId: ticket.id });
      }
      toast.success("Ticket aceptado");
    } catch {
      setError("No se pudo aceptar el ticket.");
      toast.error("No se pudo aceptar el ticket.");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleStartWork = async () => {
    if (!ticket || user?.role !== "technician") return;
    try {
      setIsStartingWork(true);
      const updated = await startTicketWork(ticket.id);
      setTicket(updated);
      toast.success("Trabajo iniciado");
    } catch {
      setError("No se pudo iniciar el trabajo del ticket.");
      toast.error("No se pudo iniciar el trabajo.");
    } finally {
      setIsStartingWork(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header showLogout />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 rounded-xl bg-slate-200" />
            <div className="h-48 rounded-xl bg-slate-200" />
            <div className="h-48 rounded-xl bg-slate-200" />
          </div>
        </main>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header showLogout />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-center text-sm text-slate-500">{error || "Ticket no encontrado"}</p>
        </main>
      </div>
    );
  }

  const canCancel = user?.role === "client" && (currentStatus === "pending" || currentStatus === "assigned");

  const canRelease =
    user?.role === "technician" &&
    currentStatus === "assigned" &&
    ticket.technician_id === user?.id;

  const canAccept = user?.role === "technician" && currentStatus === "pending";
  const canStartWork =
    user?.role === "technician" &&
    currentStatus === "assigned" &&
    ticket.technician_id === user?.id;

  const attachmentPaths = getAttachmentPaths(
    ticket.file_url,
    ticket.fileUrl,
    ticket.attachment_url,
    ticket.attachmentUrl,
    ticket.file_urls,
    ticket.attachments
  );
  const attachmentUrls = attachmentPaths
    .map((path) => getFileUrl(path))
    .filter((url): url is string => Boolean(url));
  const canShowContactInfo =
    (ticket.status === "assigned" || ticket.status === "in_progress") && !!ticket.contactInfo;
  const contactTitle =
    user?.role === "client" ? "Informacion de contacto del tecnico" : "Informacion de contacto del cliente";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showLogout />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="space-y-6">
          <TicketHeader
            ticket={ticket}
            currentStatus={currentStatus}
            allowedOptions={allowedOptions}
            isSelectDisabled={isSelectDisabled}
            onStatusChange={handleStatusChange}
            userRole={user?.role}
            canCancel={canCancel}
            isCancelling={isCancelling}
            onCancel={handleCancelTicket}
            canRelease={canRelease}
            isReleasing={isReleasing}
            onRelease={handleReleaseTicket}
            canAccept={canAccept}
            isAccepting={isAccepting}
            onAccept={handleAcceptTicket}
            canStartWork={canStartWork}
            isStartingWork={isStartingWork}
            onStartWork={handleStartWork}
          />

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-6 md:col-span-2">
              <Card className="rounded-xl border border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-slate-900">Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-slate-700">{ticket.description}</p>
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <span className="font-medium">Categoría:</span> {ticket.category || "general"}
                  </div>
                  {!!attachmentUrls.length && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {attachmentUrls.map((url) => (
                        <img
                          key={url}
                          src={url}
                          alt="Adjunto del ticket"
                          className="max-w-full cursor-pointer rounded-lg object-cover transition hover:opacity-80"
                          onClick={() => setSelectedImage(url)}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <TicketActivity ticket={ticket} />
            </div>

            <div className="space-y-6">
              <TicketInfoCard ticket={ticket} />

              {canShowContactInfo && (
                <Card className="rounded-xl border border-slate-200 bg-white">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-900">
                      {contactTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-700">
                    {user?.role === "client" && ticket.contactInfo?.technicianPhone && (
                      <p>
                        <span className="font-medium text-slate-900">Telefono:</span>{" "}
                        {ticket.contactInfo.technicianPhone}
                      </p>
                    )}

                    {user?.role === "client" && ticket.contactInfo?.technicianAddress && (
                      <p>
                        <span className="font-medium text-slate-900">Direccion:</span>{" "}
                        {ticket.contactInfo.technicianAddress}
                      </p>
                    )}

                    {user?.role === "technician" && ticket.contactInfo?.clientPhone && (
                      <p>
                        <span className="font-medium text-slate-900">Telefono:</span>{" "}
                        {ticket.contactInfo.clientPhone}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <ImagePreviewModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}

