import { useEffect, useRef, useState } from "react";
import { MessageCircleMore } from "lucide-react";
import type { Ticket } from "../../types";
import { useTicketConversation } from "../../hooks/useTicketConversation";
import { ChatInput } from "../ChatInput";
import { ChatMessage } from "../ChatMessage";
import { ImagePreviewModal } from "../ui/ImagePreviewModal";
import { ChatHeader } from "./ChatHeader";

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
      <section className="flex h-full min-h-0 items-center justify-center bg-[#f9fafb] p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
            <MessageCircleMore className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-900">Selecciona un ticket para comenzar</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Elige una conversacion en la barra lateral para ver mensajes y responder en tiempo real.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ChatHeader ticket={ticket} />

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f9fafb] px-4 py-4 sm:px-6">
        <div className="mx-auto w-full max-w-5xl space-y-3">
          {isLoading && (
            <div className="space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-56 animate-pulse rounded bg-slate-200" />
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!isLoading && !error && !messages?.length && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Aun no hay mensajes en este ticket.
            </div>
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
      </div>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
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

      <ImagePreviewModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </section>
  );
}
