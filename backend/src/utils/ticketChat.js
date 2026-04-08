export const WRITABLE_CHAT_STATUSES = new Set(['assigned', 'in_progress']);
export const CLOSED_CHAT_STATUSES = new Set(['resolved', 'cancelled']);

export const isClosedChatStatus = (status) => CLOSED_CHAT_STATUSES.has(status);
