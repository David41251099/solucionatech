import { AlertCircle, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import type { Ticket } from "../../types";
import { formatRelativeTime } from "../../utils/date";

interface TicketActivityProps {
  ticket: Ticket;
}

export function TicketActivity({ ticket }: TicketActivityProps) {
  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Actividad</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">Ticket creado</p>
              <p className="text-sm text-slate-500">{formatRelativeTime(ticket.created_at)}</p>
            </div>
          </div>

          {ticket.technician_name && (
            <>
              <Separator />
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <User className="h-4 w-4 text-amber-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Asignado a {ticket.technician_name}</p>
                  <p className="text-sm text-slate-500">{formatRelativeTime(ticket.updated_at)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
