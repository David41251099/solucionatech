import type { TicketMessage } from "../../types";
import { formatRelativeTime } from "../../utils/date";
import { getChatFileKind, getChatFileUrl } from "./chat-utils";

interface MessageBubbleProps {
  message: TicketMessage;
  isOwn: boolean;
  onImageClick?: (url: string) => void;
}

export function MessageBubble({ message, isOwn, onImageClick }: MessageBubbleProps) {
  const isSystem = message.is_system;
  const textContent = message.message?.trim() ?? "";
  const normalizedFileUrl = message.file_url || message.fileUrl || null;
  const hasVisibleText = !!textContent && !/^adjunto$/i.test(textContent);

  const renderAttachment = () => {
    if (!normalizedFileUrl) return null;
    const url = getChatFileUrl(normalizedFileUrl);
    if (!url) return null;

    const fileKind = getChatFileKind(normalizedFileUrl);

    if (fileKind === "image") {
      return (
        <img
          src={url}
          alt="Adjunto"
          className="mt-2 max-h-60 w-auto max-w-full cursor-pointer rounded-xl object-cover"
          loading="lazy"
          onClick={() => onImageClick?.(url)}
        />
      );
    }

    if (fileKind === "video") {
      return (
        <video
          src={url}
          controls
          className="mt-2 max-h-60 w-auto max-w-full rounded-xl"
          preload="metadata"
        />
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-xs underline"
      >
        Ver archivo adjunto
      </a>
    );
  };

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[80%] rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-center text-xs text-slate-600">
          {hasVisibleText ? textContent : "Evento del sistema"}
          <p className="mt-1 text-[10px] text-slate-500">{formatRelativeTime(message.created_at)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isOwn ? "bg-[#3498db] text-white" : "bg-slate-100 text-slate-900"
        }`}
      >
        {!isOwn && (
          <p className="mb-1 text-[11px] font-medium text-slate-500">
            {message.sender_name || "Usuario"}
          </p>
        )}
        {hasVisibleText && <p className="whitespace-pre-wrap text-sm leading-relaxed">{textContent}</p>}
        {renderAttachment()}
        <p className={`mt-1.5 text-[10px] ${isOwn ? "text-blue-100" : "text-slate-500"}`}>
          {formatRelativeTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

export default MessageBubble;
