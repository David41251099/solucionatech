export const CONTACT_VISIBLE_STATUSES = new Set(['assigned', 'in_progress']);

const resolveUserId = (user) => user?.userId ?? user?.id ?? null;

export const canViewContactInfo = (user, ticket) => {
  const userId = resolveUserId(user);

  if (!userId || !ticket) {
    return false;
  }

  const isParticipant =
    ticket.client_id === userId || ticket.technician_id === userId;

  if (!isParticipant) {
    return false;
  }

  if (!CONTACT_VISIBLE_STATUSES.has(ticket.status)) {
    return false;
  }

  if (!ticket.technician_id) {
    return false;
  }

  return true;
};
