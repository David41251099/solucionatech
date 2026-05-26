import { AnimatePresence } from "framer-motion";
import { TicketCard } from "./TicketCard";
import type { Ticket } from "../../types";
import type { ReactNode } from "react";
import { IconTicketOff } from "@tabler/icons-react";
import { EmptyState } from "../ui/EmptyState";
import { TicketListSkeleton } from "./TicketListSkeleton";
import type { TicketViewerRole } from "../../utils/ticketStatus";

interface TicketListProps {
  tickets: Ticket[];
  isLoading: boolean;
  error?: string | null;
  emptyTitle: string;
  emptyDescription?: string;
  onTakeTicket?: (ticketId: string) => Promise<void> | void;
  takingId?: string | null;
  showViewDetails?: boolean;
  footer?: ReactNode;
  viewerRole?: TicketViewerRole;
}

export function TicketList({
  tickets,
  isLoading,
  error,
  emptyTitle,
  emptyDescription,
  onTakeTicket,
  takingId,
  showViewDetails,
  footer,
  viewerRole,
}: TicketListProps) {
  if (isLoading) {
    return <TicketListSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={<IconTicketOff className="h-5 w-5" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
      <AnimatePresence>
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            id={ticket.id}
            title={ticket.title}
            description={ticket.description}
            status={ticket.status}
            city={ticket.city}
            category={ticket.category}
            createdAt={ticket.created_at}
            assignedTo={ticket.technician_name ?? undefined}
            onTakeTicket={onTakeTicket}
            isTaking={takingId === ticket.id}
            showViewDetails={showViewDetails}
            viewerRole={viewerRole}
          />
        ))}
      </AnimatePresence>
      {footer && <div className="pt-1">{footer}</div>}
    </div>
  );
}
