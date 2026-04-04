import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../context/ChatContext";
import { ChatInput, type ChatSendPayload } from "../ChatInput";
import { ChatMessage } from "../ChatMessage";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/EmptyState";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { ImagePreviewModal } from "../ui/ImagePreviewModal";
import { ScrollArea } from "../ui/scroll-area";
import { devLog, devWarn } from "../../utils/devLog";

interface TicketChatProps {
  mode?: "floating" | "page";
  defaultTicketId?: string | null;
}

function TicketList() {
  const { tickets, selectedTicketId, selectTicket, isLoadingTickets } = useChat();

  if (isLoadingTickets) {
    return <p className="text-sm text-muted-foreground">Cargando tickets...</p>;
  }

  if (!tickets.length) {
    return <p className="text-sm text-muted-foreground">No hay tickets activos para chat.</p>;
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => {
        const isSelected = ticket.id === selectedTicketId;
        return (
          <button
            key={ticket.id}
            type="button"
            onClick={() => {
              devLog("CLICK TICKET:", ticket);
              devLog("SETTING selectedTicketId:", ticket.id);
              if (!ticket?.id) {
                devWarn("Ticket invalido:", ticket);
                return;
              }
              selectTicket(ticket.id);
            }}
            className={`w-full rounded-xl border px-3 py-2 text-left transition ${
              isSelected
                ? "border-blue-200 bg-blue-50"
                : "border-border bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <p className="truncate text-sm font-medium text-slate-900">{ticket.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">#{ticket.id.slice(0, 8)}</p>
          </button>
        );
      })}
    </div>
  );
}

function Conversation({ compact }: { compact?: boolean }) {
  const { user } = useAuth();
  const {
    selectedTicketId,
    tickets,
    messages,
    isLoadingMessages,
    isSending,
    error,
    sendMessage,
    selectTicket,
  } = useChat();
  const [draft, setDraft] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  );

  const currentMessages = selectedTicketId ? messages[selectedTicketId] ?? [] : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length]);

  if (!selectedTicketId) {
    return (
      <EmptyState
        title="Selecciona un ticket para comenzar"
        description="Elige una conversacion para ver mensajes en tiempo real."
      />
    );
  }

  if (isLoadingMessages) {
    return <LoadingState message="Cargando ticket..." />;
  }

  if (!selectedTicket) {
    return <ErrorState message="No se puede cargar el ticket" />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const handleSend = async (payload?: ChatSendPayload) => {
    const message = payload?.message ?? draft;
    const file = payload?.file ?? selectedFile;
    const formData = payload?.formData;

    await sendMessage({ message, file, formData });
    setDraft("");
    setSelectedFile(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="truncate text-sm font-semibold text-slate-900">{selectedTicket.title}</p>
          <p className="text-xs text-muted-foreground">#{selectedTicket.id}</p>
        </div>
        {!compact && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => selectTicket(null)}
          >
            Volver
          </Button>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4 py-3">
        <div className="space-y-3">
          {!currentMessages.length && (
            <p className="text-sm text-muted-foreground">No hay mensajes todavia.</p>
          )}

          {currentMessages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwn={!!user?.id && message.sender_id === user.id}
              onImageClick={setPreviewImage}
            />
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border px-4 py-3">
        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          onFileSelect={setSelectedFile}
          selectedFile={selectedFile}
          isSending={isSending}
          disabled={!user?.id}
        />
      </div>

      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}

export function TicketChat({ mode = "floating", defaultTicketId = null }: TicketChatProps) {
  const { isAuthenticated } = useAuth();
  const { isOpen, setIsOpen, selectedTicketId, selectTicket } = useChat();

  useEffect(() => {
    if (defaultTicketId) {
      devLog("SETTING selectedTicketId:", defaultTicketId);
      if (!defaultTicketId.trim()) {
        devWarn("Ticket invalido:", defaultTicketId);
        return;
      }
      selectTicket(defaultTicketId);
    }
  }, [defaultTicketId, selectTicket]);

  if (!isAuthenticated) {
    return null;
  }

  if (mode === "page") {
    return (
      <section className="grid h-[calc(100vh-72px)] min-h-0 grid-cols-1 border border-border bg-white md:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-r border-border p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Tickets</h2>
          <ScrollArea className="h-[calc(100vh-180px)] pr-2">
            <TicketList />
          </ScrollArea>
        </aside>
        <Conversation compact />
      </section>
    );
  }

  return (
    <>
      <div className="solucionatech-floating-chat fixed bottom-6 right-6 z-40">
        <Button
          type="button"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="h-12 w-12 rounded-full shadow-lg"
          aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
        >
          {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </Button>
      </div>

      <div
        className={`fixed bottom-24 right-6 z-40 w-[360px] rounded-2xl border border-border bg-white shadow-xl transition-all duration-200 ${
          isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        } solucionatech-floating-chat`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Chat global</p>
            <p className="text-xs text-muted-foreground">Tickets activos</p>
          </div>
          <div className="flex items-center gap-1">
            {selectedTicketId && (
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
                aria-label="Expandir chat"
                onClick={() => {
                  window.location.assign(`/tickets/${selectedTicketId}/chat`);
                }}
              >
                Expandir
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
              aria-label="Cerrar chat"
            >
              X
            </button>
          </div>
        </div>

        <div className="h-[460px]">
          {selectedTicketId ? (
            <Conversation />
          ) : (
            <div className="h-full p-4">
              <ScrollArea className="h-full pr-2">
                <TicketList />
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default TicketChat;

