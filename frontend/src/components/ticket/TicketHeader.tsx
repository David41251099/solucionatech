import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { StatusBadge } from "../StatusBadge";
import type { Ticket, TicketStatus } from "../../types";

const statusLabels: Record<TicketStatus, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  in_progress: "En progreso",
  resolved: "Resuelto",
  cancelled: "Cancelado",
};

interface TicketHeaderProps {
  ticket: Ticket;
  currentStatus: TicketStatus;
  allowedOptions: TicketStatus[];
  isSelectDisabled: boolean;
  onStatusChange: (newStatus: TicketStatus) => void;
  userRole?: "client" | "technician";
  canCancel: boolean;
  isCancelling: boolean;
  onCancel: () => void;
  canRelease: boolean;
  isReleasing: boolean;
  onRelease: () => void;
  canAccept: boolean;
  isAccepting: boolean;
  onAccept: () => void;
  canStartWork: boolean;
  isStartingWork: boolean;
  onStartWork: () => void;
}

export function TicketHeader({
  ticket,
  currentStatus,
  allowedOptions,
  isSelectDisabled,
  onStatusChange,
  userRole,
  canCancel,
  isCancelling,
  onCancel,
  canRelease,
  isReleasing,
  onRelease,
  canAccept,
  isAccepting,
  onAccept,
  canStartWork,
  isStartingWork,
  onStartWork,
}: TicketHeaderProps) {
  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-none">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={currentStatus} role={userRole} />
              {ticket.category && (
                <Badge variant="outline" className="border-slate-300 text-slate-600">
                  Categoria: {ticket.category}
                </Badge>
              )}
            </div>
            <CardTitle className="mb-2 text-2xl font-bold text-slate-900">{ticket.title}</CardTitle>
            <p className="text-sm text-slate-500">Ticket #{ticket.id}</p>
          </div>

          <div className="flex w-full flex-col items-end gap-3 sm:w-auto sm:min-w-[220px]">
            {userRole === "technician" && (
              <div className="w-full sm:w-48">
                <Select value={currentStatus} onValueChange={(value) => onStatusChange(value as TicketStatus)} disabled={isSelectDisabled}>
                  <SelectTrigger className="border border-slate-300 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              {canAccept && (
                <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={onAccept} disabled={isAccepting}>
                  {isAccepting ? "Tomando..." : "Tomar ticket"}
                </Button>
              )}

              {canStartWork && (
                <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={onStartWork} disabled={isStartingWork}>
                  {isStartingWork ? "Iniciando..." : "Iniciar trabajo"}
                </Button>
              )}

              {canCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isCancelling}>
                      {isCancelling ? "Cancelando..." : "Cancelar solicitud"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar solicitud</AlertDialogTitle>
                      <AlertDialogDescription>Estas seguro de cancelar esta solicitud?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Volver</AlertDialogCancel>
                      <AlertDialogAction onClick={onCancel}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {canRelease && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isReleasing}>
                      {isReleasing ? "Liberando..." : "Liberar ticket"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Liberar ticket</AlertDialogTitle>
                      <AlertDialogDescription>Deseas liberar este ticket para que otro tecnico lo tome?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Volver</AlertDialogCancel>
                      <AlertDialogAction onClick={onRelease}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
