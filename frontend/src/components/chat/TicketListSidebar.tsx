import { MessageSquareText } from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { ScrollArea } from "../ui/scroll-area";
import { formatRelativeTime } from "../../utils/date";
import type { Ticket, TicketMessage } from "../../types";
import {
  getMessagePreview,
  getNormalizedUnreadCounts,
  normalizeChatEntityId,
} from "./chat-utils";
import { useChat } from "../../context/ChatContext";

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
  const { unreadCounts = {} } = useChat();
  const normalizedUnreadCounts = getNormalizedUnreadCounts(unreadCounts);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-slate-200 bg-white md:w-[300px]">
      <div className="border-b border-slate-200 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Conversaciones</p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">Tickets activos</h1>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1.5 p-2.5">
          {isLoading && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-muted-foreground">
              Cargando conversaciones...
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!isLoading && !error && !items.length && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-muted-foreground">
              <MessageSquareText className="mx-auto mb-2 h-5 w-5 text-slate-400" />
              No hay tickets activos para mostrar.
            </div>
          )}

          {items.map(({ ticket, lastMessage }) => {
            const isSelected = ticket.id === selectedTicketId;
            const ticketIdNorm = normalizeChatEntityId(ticket.id);
            const unread = normalizedUnreadCounts[ticketIdNorm] || 0;
            const unreadLabel = unread > 99 ? "99+" : unread;

            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() => onSelect(ticket.id)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${
                  isSelected
                    ? "border-slate-300 bg-gray-100"
                    : "border-transparent bg-white hover:bg-gray-100"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{ticket.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">{getMessagePreview(lastMessage)}</p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {lastMessage && (
                      <span className="text-[14px] text-slate-400">
                        {formatRelativeTime(lastMessage.created_at)}
                      </span>
                    )}
                    {unread > 0 && (
                      <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-sm animate-pulse">
                        {unreadLabel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
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
