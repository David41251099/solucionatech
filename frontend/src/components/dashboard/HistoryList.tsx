import type { Ticket } from "../../types";
import type { ReactNode } from "react";
import { TicketList } from "./TicketList";
import type { TicketViewerRole } from "../../utils/ticketStatus";

interface HistoryListProps {
  tickets: Ticket[];
  isLoading: boolean;
  error?: string | null;
  emptyTitle: string;
  emptyDescription?: string;
  footer?: ReactNode;
  viewerRole?: TicketViewerRole;
}

export function HistoryList({
  tickets,
  isLoading,
  error,
  emptyTitle,
  emptyDescription,
  footer,
  viewerRole,
}: HistoryListProps) {
  return (
    <TicketList
      tickets={tickets}
      isLoading={isLoading}
      error={error}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      showViewDetails
      footer={footer}
      viewerRole={viewerRole}
    />
  );
}
