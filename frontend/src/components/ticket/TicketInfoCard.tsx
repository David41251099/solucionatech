import { Clock, Tag, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import type { Ticket } from "../../types";
import { formatRelativeTime } from "../../utils/date";

interface TicketInfoCardProps {
  ticket: Ticket;
}

export function TicketInfoCard({ ticket }: TicketInfoCardProps) {
  const categoryValue = ticket.category || "General";

  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Informacion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <User className="h-4 w-4" />
            <span>Creado por</span>
          </div>
          <p className="text-sm font-medium text-slate-800">{ticket.client_name || ticket.client_email || "Cliente"}</p>
        </div>

        <Separator />

        {ticket.technician_name && (
          <>
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
                <User className="h-4 w-4" />
                <span>Asignado a</span>
              </div>
              <p className="text-sm font-medium text-slate-800">{ticket.technician_name}</p>
            </div>
            <Separator />
          </>
        )}

        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <Tag className="h-4 w-4" />
            <span>Categoria</span>
          </div>
          <p className="text-sm font-medium text-slate-800">{categoryValue}</p>
        </div>

        <Separator />

        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            <span>Creado</span>
          </div>
          <p className="text-sm font-medium text-slate-800">{formatRelativeTime(ticket.created_at)}</p>
        </div>

        <Separator />

        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            <span>Actualizado</span>
          </div>
          <p className="text-sm font-medium text-slate-800">{formatRelativeTime(ticket.updated_at)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
