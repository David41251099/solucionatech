import type { TicketMessage } from "../types";
import { MessageBubble } from "./chat/MessageBubble";

interface ChatMessageProps {
  message: TicketMessage;
  isOwn: boolean;
  onImageClick?: (url: string) => void;
}

export function ChatMessage({ message, isOwn, onImageClick }: ChatMessageProps) {
  return <MessageBubble message={message} isOwn={isOwn} onImageClick={onImageClick} />;
}

