import { TicketListSidebar, type ChatTicketSummary } from "./TicketListSidebar";

interface ChatSidebarProps {
  items: ChatTicketSummary[];
  selectedTicketId?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onSelect: (ticketId: string) => void;
}

export function ChatSidebar(props: ChatSidebarProps) {
  return <TicketListSidebar {...props} />;
}

export default ChatSidebar;
