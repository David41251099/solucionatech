import { useEffect } from "react";
import type { TicketMessage } from "../types";
import { formatRelativeTime } from "../utils/date";
import { getChatFileKind, getChatFileUrl } from "./chat/chat-utils";
import { devLog } from "../utils/devLog";

interface ChatMessageProps {
  message: TicketMessage;
  isOwn: boolean;
  onImageClick?: (url: string) => void;
}

export function ChatMessage({ message, isOwn, onImageClick }: ChatMessageProps) {
  const isSystem = message.is_system;
  const textContent = message.message?.trim() ?? "";
  const normalizedFileUrl = message.file_url || message.fileUrl || null;
  const hasVisibleText = !!textContent && !/^adjunto$/i.test(textContent);

  const renderMessageContent = (msg: TicketMessage) => {
    const normalizedFileUrl = msg.file_url || msg.fileUrl || null;

    if (msg.type === "image" && normalizedFileUrl) {
      const url = getChatFileUrl(normalizedFileUrl);
      if (!url) return null;
      return (
        <img
          src={url}
          alt="Imagen adjunta"
          className="chat-image mt-2 max-w-full cursor-pointer rounded-lg object-cover shadow-sm transition hover:opacity-80"
          loading="lazy"
          onClick={() => onImageClick?.(url)}
        />
      );
    }

    if (normalizedFileUrl) {
      const url = getChatFileUrl(normalizedFileUrl);
      const fileKind = getChatFileKind(normalizedFileUrl);

      if (url && fileKind === "video") {
        return (
          <video
            src={url}
            controls
            className="chat-video mt-2 max-w-[220px] rounded-2xl shadow-sm"
            preload="metadata"
          />
        );
      }

      if (url && fileKind === "image") {
        return (
          <img
            src={url}
            alt="Imagen adjunta"
            className="chat-image mt-2 max-w-[220px] cursor-pointer rounded-2xl object-cover shadow-sm transition hover:opacity-80"
            loading="lazy"
            onClick={() => onImageClick?.(url)}
          />
        );
      }

      if (url) {
        return (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-xs underline"
          >
            Ver archivo adjunto
          </a>
        );
      }
    }

    return <p className="whitespace-pre-wrap">{msg.message}</p>;
  };

  useEffect(() => {
    if (import.meta.env.DEV) {
      devLog("MESSAGE RECEIVED:", message);
      if (message?.file_url || message?.fileUrl) {
        const normalizedFileUrl = message.file_url || message.fileUrl;
        devLog("VITE_API_URL:", import.meta.env.VITE_API_URL);
        devLog("Resolved chat file URL:", getChatFileUrl(normalizedFileUrl));
      }
    }
  }, [message]);

  const containerClass = isSystem
    ? "justify-center"
    : isOwn
      ? "justify-end"
      : "justify-start";

  const bubbleClass = isSystem
    ? "bg-slate-100 text-slate-600 border border-slate-200"
    : isOwn
      ? "bg-blue-600 text-white"
      : "bg-slate-100 text-slate-900";

  return (
    <div className={`flex ${containerClass}`}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${bubbleClass}`}>
        {!isSystem && !isOwn && (
          <p className="text-[11px] font-medium text-slate-500 mb-1">
            {message.sender_name || "Usuario"}
          </p>
        )}
        {hasVisibleText && (
          <p className="whitespace-pre-wrap">{textContent}</p>
        )}
        {normalizedFileUrl ? renderMessageContent(message) : null}
        {!normalizedFileUrl && message.type === "image" && !hasVisibleText && (
          <p className="text-xs italic opacity-80">Adjunto no disponible</p>
        )}
        <p className={`mt-1 text-[10px] ${isSystem ? "text-slate-500" : isOwn ? "text-blue-100" : "text-slate-500"}`}>
          {formatRelativeTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

