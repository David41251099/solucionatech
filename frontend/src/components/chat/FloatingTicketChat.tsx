import { lazy, Suspense, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "../ui/button";

const LazyTicketChat = lazy(() => import("./TicketChat"));

interface FloatingTicketChatProps {
  ticketId: string;
  currentUserId?: string;
}

export function FloatingTicketChat({ ticketId, currentUserId }: FloatingTicketChatProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          type="button"
          size="icon"
          onClick={() => setIsOpen((prev) => !prev)}
          className="h-12 w-12 rounded-full shadow-lg"
          aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
        >
          {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </Button>
      </div>

      <div
        className={`fixed bottom-24 right-6 z-40 w-[320px] rounded-2xl border border-border bg-white shadow-xl transition-all duration-200 ${
          isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Chat del ticket</p>
            <p className="text-xs text-muted-foreground">Soporte en tiempo real</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1 text-muted-foreground transition hover:bg-muted"
            aria-label="Cerrar chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-[420px] p-4">
          {isOpen && (
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Cargando chat...
                </div>
              }
            >
              <LazyTicketChat mode="page" defaultTicketId={ticketId} />
            </Suspense>
          )}
        </div>
      </div>
    </>
  );
}

export default FloatingTicketChat;
