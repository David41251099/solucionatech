import { Card, CardContent } from "./ui/card";
import { motion } from "framer-motion";
import type { KeyboardEvent, MouseEvent } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Clock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { TicketStatus } from "../types";
import { formatRelativeTime } from "../utils/date";
import { StatusBadge } from "./StatusBadge";
import type { TicketViewerRole } from "../utils/ticketStatus";

interface TicketCardProps {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  category?: string | null;
  createdAt: string;
  assignedTo?: string;
  onTakeTicket?: (ticketId: string) => Promise<void> | void;
  isTaking?: boolean;
  showViewDetails?: boolean;
  viewerRole?: TicketViewerRole;
}

export function TicketCard({
  id,
  title,
  description,
  status,
  category,
  createdAt,
  assignedTo,
  onTakeTicket,
  isTaking,
  showViewDetails = false,
  viewerRole,
}: TicketCardProps) {
  const navigate = useNavigate();
  const showTakeTicket = status === "pending" && !!onTakeTicket;
  const showViewDetailsButton = showViewDetails && !showTakeTicket;

  const handleNavigate = () => {
    navigate(`/tickets/${id}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNavigate();
    }
  };

  const handleTakeTicket = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!onTakeTicket) return;
    await onTakeTicket(id);
  };

  const handleViewDetails = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    handleNavigate();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="cursor-pointer rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-slate-300"
        onClick={handleNavigate}
        role="link"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-3 gap-4">
            <div className="flex-1">
              <h3 className="mb-1 text-base font-semibold text-slate-900">{title}</h3>
              <p className="line-clamp-2 text-sm text-slate-500">{description}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <StatusBadge status={status} role={viewerRole} />
            {category && (
              <Badge variant="outline">Categoría: {category}</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-4 text-slate-500">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatRelativeTime(createdAt)}</span>
              </div>
              {assignedTo && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{assignedTo}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {showViewDetailsButton && (
                <Button size="sm" variant="outline" onClick={handleViewDetails}>
                  Ver detalle
                </Button>
              )}
              {showTakeTicket && (
                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleTakeTicket} disabled={isTaking}>
                  {isTaking ? "Tomando..." : "Tomar ticket"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
