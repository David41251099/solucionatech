import type { TicketStatus } from "../types";

export type TicketViewerRole = "client" | "technician" | null | undefined;

const defaultStatusLabels: Record<TicketStatus, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  in_progress: "En proceso",
  resolved: "Resuelto",
  cancelled: "Cancelado",
};

const statusClasses: Record<TicketStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  assigned: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export const getStatusLabel = (
  status: TicketStatus,
  role?: TicketViewerRole
): string | null => {
  if (status === "pending" && role === "technician") {
    return null;
  }

  if (status === "pending" && role === "client") {
    return "Sin asignar";
  }

  return defaultStatusLabels[status];
};

export const getStatusBadgeClass = (
  status: TicketStatus,
  role?: TicketViewerRole
): string => {
  if (status === "pending" && role === "client") {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  return statusClasses[status];
};

