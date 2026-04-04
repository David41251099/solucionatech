import { useEffect, useRef, useState } from "react";
import { MessageCircleMore } from "lucide-react";
import type { Ticket } from "../../types";
import { useTicketConversation } from "../../hooks/useTicketConversation";
import { ChatInput } from "../ChatInput";
import { ChatMessage } from "../ChatMessage";
import { ImagePreviewModal } from "../ui/ImagePreviewModal";
import { ScrollArea } from "../ui/scroll-area";
import { StatusBadge } from "../StatusBadge";

interface ChatWindowProps {
  ticket?: Ticket | null;
  currentUserId?: string;
}

export function ChatWindow({ ticket, currentUserId }: ChatWindowProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const {
    messages,
    draft,
    setDraft,
    selectedFile,
    setSelectedFile,
    isLoading,
    isSending,
    error,
    sendMessage,
  } = useTicketConversation({
    ticketId: ticket?.id,
    currentUserId,
  });
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!ticket) {
    return (
      <section className="flex h-full min-h-0 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_45%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <MessageCircleMore className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-900">Selecciona un ticket</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Elige una conversación en la barra lateral para ver mensajes, archivos y responder en tiempo real.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)]">
      <div className="border-b border-border bg-white/90 px-6 py-4 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
              Ticket seleccionado
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold text-slate-900">{ticket.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">#{ticket.id}</p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      <div className="min-h-0 flex-1 px-4 py-4 sm:px-6">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white/80 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur">
          <ScrollArea className="min-h-0 flex-1 px-4 py-5 sm:px-5">
            <div className="space-y-3">
              {isLoading && (
                <p className="text-sm text-muted-foreground">Cargando mensajes...</p>
              )}

              {!isLoading && error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!isLoading && !error && !messages?.length && (
                <p className="text-sm text-muted-foreground">
                  Aun no hay mensajes en este ticket.
                </p>
              )}

              {messages?.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwn={!!currentUserId && message.sender_id === currentUserId}
                  onImageClick={setSelectedImage}
                />
              ))}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-5">
            <ChatInput
              value={draft}
              onChange={setDraft}
              onSend={sendMessage}
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
              disabled={!currentUserId || isLoading}
              isSending={isSending}
            />
          </div>
        </div>
      </div>

      <ImagePreviewModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </section>
  );
}
