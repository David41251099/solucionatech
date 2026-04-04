import { MessageSquareText } from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { ScrollArea } from "../ui/scroll-area";
import { formatRelativeTime } from "../../utils/date";
import type { Ticket, TicketMessage } from "../../types";
import { getMessagePreview } from "./chat-utils";

export interface ChatTicketSummary {
  ticket: Ticket;
  lastMessage: TicketMessage | null;
}

interface TicketListSidebarProps {
  items: ChatTicketSummary[];
  selectedTicketId?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onSelect: (ticketId: string) => void;
}

export function TicketListSidebar({
  items,
  selectedTicketId,
  isLoading,
  error,
  onSelect,
}: TicketListSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-border bg-white">
      <div className="border-b border-border px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
          SolucionaTech
        </p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Chats activos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecciona un ticket para conversar en tiempo real.
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 p-3">
          {isLoading && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-muted-foreground">
              Cargando conversaciones...
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!isLoading && !error && !items.length && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-muted-foreground">
              <MessageSquareText className="mx-auto mb-2 h-5 w-5 text-slate-400" />
              No hay tickets activos para mostrar.
            </div>
          )}

          {items.map(({ ticket, lastMessage }) => {
            const isSelected = ticket.id === selectedTicketId;

            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() => onSelect(ticket.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  isSelected
                    ? "border-blue-200 bg-blue-50 shadow-sm"
                    : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{ticket.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {getMessagePreview(lastMessage)}
                    </p>
                  </div>
                  <div className="shrink-0 text-[11px] text-slate-400">
                    {lastMessage ? formatRelativeTime(lastMessage.created_at) : ""}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <StatusBadge status={ticket.status} />
                  <span className="text-[11px] text-slate-400">#{ticket.id.slice(0, 8)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
