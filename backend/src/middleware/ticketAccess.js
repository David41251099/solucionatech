import { query } from '../config/database.js';
import { logger } from '../config/logger.js';
import AppError from '../utils/AppError.js';

const WRITABLE_CHAT_STATUSES = new Set(['assigned', 'in_progress']);

const getRequestLogContext = (req, extra = {}) => ({
  requestId: req.context?.requestId ?? req.requestId ?? null,
  userId: req.context?.userId ?? req.user?.userId ?? req.user?.id ?? null,
  ticketId: req.params?.id ?? null,
  ...extra,
});

export const canUserInteractWithTicket = (userId, ticket) => {
  if (!userId || !ticket) {
    return false;
  }

  const isClientOwner = ticket.client_id === userId;
  const isAssignedTechnician = ticket.technician_id === userId;

  if (!isClientOwner && !isAssignedTechnician) {
    return false;
  }

  if (!WRITABLE_CHAT_STATUSES.has(ticket.status)) {
    return false;
  }

  if (!ticket.technician_id) {
    return false;
  }

  return true;
};

export const ensureTicketMessageAccessBeforeUpload = async (req, res, next) => {
  try {
    const ticketId = req.params?.id;
    const userId = req.user?.userId ?? req.user?.id ?? null;
    const role = req.user?.role ?? null;

    if (!ticketId || !userId || !role) {
      return next(new AppError('No autorizado', 401));
    }

    const ticketResult = await query(
      `SELECT id, status, client_id, technician_id
       FROM tickets
       WHERE id = $1`,
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      return next(new AppError('Ticket no encontrado', 404));
    }

    const ticket = ticketResult.rows[0];
    const canInteract = canUserInteractWithTicket(userId, ticket);
    if (!canInteract) {
      logger.warn(
        {
          ...getRequestLogContext(req, {
            action: 'unauthorized_chat_attempt',
            role,
            ticketStatus: ticket.status,
            technicianId: ticket.technician_id,
          }),
        },
        'Intento no autorizado de interaccion en chat de ticket'
      );
      return next(new AppError('No autorizado para enviar mensajes en este ticket', 403));
    }

    if (!['client', 'technician'].includes(role)) {
      return next(new AppError('Rol de usuario no valido para esta accion', 403));
    }

    req.ticketContext = ticket;
    return next();
  } catch (error) {
    return next(error);
  }
};
