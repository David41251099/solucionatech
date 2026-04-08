import { UserRound } from "lucide-react";
import type { Ticket } from "../../types";
import { StatusBadge } from "../StatusBadge";

interface ChatHeaderProps {
  ticket: Ticket;
}

export function ChatHeader({ ticket }: ChatHeaderProps) {
  const ownerLabel = ticket.technician_name || ticket.client_name || "Participantes";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{ticket.title}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <UserRound className="h-3.5 w-3.5" />
            <span className="truncate">{ownerLabel}</span>
            <span className="text-slate-300">•</span>
            <span>#{ticket.id.slice(0, 8)}</span>
          </div>
        </div>
        <StatusBadge status={ticket.status} />
      </div>
    </header>
  );
}

export default ChatHeader;
