/**
 * ticket.controller.js
 * Controladores para gesti�n de tickets
 * 
 * Endpoints implementados:
 * - createTicket: Crear nuevo ticket (solo clientes)
 * - getTickets: Listar tickets (cliente: solo suyos, t�cnico: todos)
 * - getTicketById: Ver detalle de un ticket
 * - updateTicket: Actualizar ticket (solo t�cnicos)
 * - assignTicket: Asignar ticket a t�cnico
 * - updateStatus: Cambiar estado del ticket
 */

import crypto from 'crypto';
import { query } from '../config/database.js';
import { logger } from '../config/logger.js';
import AppError from '../utils/AppError.js';
import { getIO } from '../socket/index.js';
import { sendSuccess } from '../utils/httpResponses.js';
import { canUserInteractWithTicket } from '../middleware/ticketAccess.js';
import { CLOSED_CHAT_STATUSES } from '../utils/ticketChat.js';
import { canViewContactInfo } from '../utils/contactInfo.js';

const parsePagination = (req) => {
  const limitRaw = Number(req.query.limit);
  const offsetRaw = Number(req.query.offset);

  const limit = Number.isFinite(limitRaw) && limitRaw > 0
    ? Math.floor(limitRaw)
    : 20;
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0
    ? Math.floor(offsetRaw)
    : 0;

  return { limit, offset };
};

const parseAttachmentList = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap(parseAttachmentList).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item)).filter(Boolean);
        }
      } catch {
        return [trimmed];
      }
    }

    return [trimmed];
  }

  return [];
};

const getRequestLogContext = (req, extra = {}) => ({
  requestId: req.context?.requestId ?? req.requestId ?? `http-${crypto.randomUUID()}`,
  userId: req.context?.userId ?? req.user?.userId ?? req.user?.id ?? null,
  ...extra,
});

const logControllerError = (req, action, error, extra = {}) => {
  logger.error(
    {
      ...getRequestLogContext(req, { ticketId: req.params?.id ?? null, action, ...extra }),
      err: error,
    },
    `Error en ${action}`
  );
};

const logSecurityEvent = (req, action, extra = {}) => {
  logger.warn(
    {
      ...getRequestLogContext(req, { ticketId: req.params?.id ?? null, action, ...extra }),
    },
    'Evento de seguridad'
  );
};

const STATUSES_REQUIRING_TECHNICIAN = new Set(['assigned', 'in_progress']);
const assertTicketStatusIntegrity = ({ status, technician_id }) => {
  if (status === 'pending' && technician_id) {
    throw new AppError('Integridad de ticket inválida: pending no puede tener técnico asignado', 409);
  }

  if (STATUSES_REQUIRING_TECHNICIAN.has(status) && !technician_id) {
    throw new AppError(`Integridad de ticket inválida: ${status} requiere técnico asignado`, 409);
  }
};

const assertTechnicianOwnership = (
  req,
  ticket,
  { allowPendingTake = false, deniedAction = 'unauthorized_ticket_access' } = {}
) => {
  const role = req.user?.role;
  if (role !== 'technician') {
    return;
  }

  const userId = req.user?.userId ?? req.user?.id ?? null;
  if (!userId) {
    throw new AppError('No autorizado', 401);
  }

  if (allowPendingTake && ticket.status === 'pending') {
    return;
  }

  if (ticket.technician_id !== userId) {
    logSecurityEvent(req, deniedAction, {
      ticketStatus: ticket.status,
      ticketTechnicianId: ticket.technician_id,
    });
    throw new AppError('No tienes permiso para modificar este ticket', 403);
  }
};

const assertValidTechnicianId = async (technicianId) => {
  if (!technicianId) {
    throw new AppError('technicianId es obligatorio', 400);
  }

  const technicianResult = await query(
    'SELECT id, role FROM users WHERE id = $1',
    [technicianId]
  );

  if (technicianResult.rows.length === 0 || technicianResult.rows[0].role !== 'technician') {
    throw new AppError('El técnico asignado no es válido', 400);
  }
};

const resolveTechnicianName = async (technicianId) => {
  if (!technicianId) return 'Técnico';

  const technicianResult = await query(
    'SELECT name FROM users WHERE id = $1',
    [technicianId]
  );

  return technicianResult.rows[0]?.name || 'Técnico';
};

const createSystemMessage = async (ticketId, message, systemEvent, requestId = null) => {
  const insertQuery = `
    INSERT INTO ticket_messages (ticket_id, sender_id, message, attachment_url, type, system_event, is_system)
    VALUES ($1, NULL, $2, NULL, 'system', $3, true)
    RETURNING *
  `;

  const insertResult = await query(insertQuery, [ticketId, message, systemEvent ?? null]);
  const systemMessage = insertResult.rows[0];

  try {
    const io = getIO();
    io.to(`ticket:${ticketId}`).emit('message:new', {
      ...systemMessage,
      file_url: systemMessage?.attachment_url || null,
      fileUrl: systemMessage?.attachment_url || null,
      attachment_url: systemMessage?.attachment_url || null,
      ticketId: systemMessage?.ticket_id,
      userId: systemMessage?.sender_id,
      senderId: systemMessage?.sender_id,
      content: systemMessage?.message,
      createdAt: systemMessage?.created_at,
      requestId: requestId ?? `http-${crypto.randomUUID()}`,
    });
  } catch (socketError) {
    logger.error(
      { err: socketError, ticketId, systemEvent, requestId, event: 'message:new' },
      'Socket emit error en createSystemMessage'
    );
  }

  return systemMessage;
};

/**
 * POST /api/tickets
 * Crear nuevo ticket
 * Body: { title, description, category }
 * Requiere: verifyToken, isClient
 */
export const createTicket = async (req, res, next) => {
  try {
    const logContext = getRequestLogContext(req);
    const { title, description, category, file_url, fileUrl, attachment_url, attachmentUrl, file_urls } = req.body;
    const client_id = req.user.userId;
    const files = Array.isArray(req.files) ? req.files : [];
    const uploadedFileUrls = files.map((file) => `/uploads/${file.filename}`);
    const bodyFileUrls = [
      ...parseAttachmentList(file_url),
      ...parseAttachmentList(fileUrl),
      ...parseAttachmentList(attachment_url),
      ...parseAttachmentList(attachmentUrl),
      ...parseAttachmentList(file_urls),
    ];
    const attachmentList = [...new Set([...uploadedFileUrls, ...bodyFileUrls].filter(Boolean))];
    const resolvedAttachment =
      attachmentList.length === 0
        ? null
        : attachmentList.length === 1
          ? attachmentList[0]
          : JSON.stringify(attachmentList);

    // Validar campos requeridos
    if (!title || !description) {
      return next(new AppError('Título y descripción son obligatorios', 400));
    }

    const resolvedCategory =
      typeof category === 'string' && category.trim()
        ? category.trim().toLowerCase()
        : 'general';
    const validCategories = ['general', 'hardware', 'software', 'network'];
    if (!validCategories.includes(resolvedCategory)) {
      return next(new AppError('Categoría no válida', 400));
    }

    // Insertar ticket en la base de datos
    const sqlQuery = `
      INSERT INTO tickets (title, description, category, status, client_id, attachment_url)
      VALUES ($1, $2, $3, 'pending', $4, $5)
      RETURNING *
    `;

    const result = await query(sqlQuery, [title, description, resolvedCategory, client_id, resolvedAttachment]);
    const ticket = {
      ...result.rows[0],
      attachments: attachmentList,
      file_urls: attachmentList,
    };

    try {
      const io = getIO();
      const actorId = req.user.userId ?? req.user.id;
      io.emit('ticketCreated', { ticket, actorId, requestId: logContext.requestId });
      io.emit('ticket:new', { ...ticket, requestId: logContext.requestId });
    } catch (socketError) {
      logger.error({ err: socketError, ...logContext, event: 'ticketCreated', ticketId: ticket.id }, 'Socket emit error');
    }

    logger.info(
      {
        ...logContext,
        ticketId: ticket.id,
        action: 'create_ticket',
      },
      'Ticket creado'
    );

    return sendSuccess(res, {
      status: 201,
      message: 'Ticket creado exitosamente',
      data: { ticket },
      legacy: { ticket },
    });
  } catch (error) {
    logControllerError(req, 'create_ticket', error);
    next(error);
  }
};

/**
 * GET /api/tickets
 * Listar tickets
 * Cliente: solo sus tickets
 * T�cnico: todos los tickets
 * Requiere: verifyToken
 */
export const getTickets = async (req, res, next) => {
  try {
    const logContext = getRequestLogContext(req);
    if (!req.user) {
      return next(new AppError('No autorizado', 401));
    }

    const { role } = req.user;
    const userId = req.user.userId ?? req.user.id;
    const statusParam = typeof req.query.status === 'string' ? req.query.status : '';
    const statusFilters = statusParam
      ? statusParam
        .split(',')
        .map((status) => status.trim())
        .filter(Boolean)
      : [];
    const validStatuses = ['pending', 'assigned', 'in_progress', 'resolved', 'cancelled'];

    if (statusFilters.some((status) => !validStatuses.includes(status))) {
      return next(new AppError('Filtro de estado no válido', 400));
    }

    const { limit, offset } = parsePagination(req);

    let sqlQuery;
    let params = [];

    if (role === 'client') {
      // Cliente: solo ver sus propios tickets
      const whereClauses = ['t.client_id = $1'];
      params = [userId];

      if (statusFilters.length > 0) {
        params.push(statusFilters);
        whereClauses.push(`t.status = ANY($${params.length})`);
      }

      sqlQuery = `
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.category,
          t.client_id,
          t.technician_id,
          t.created_at,
          t.updated_at,
          t.attachment_url,
          t.attachment_url as file_url,
          c.name as client_name,
          c.email as client_email,
          tech.name as technician_name,
          tech.email as technician_email
        FROM tickets t
        INNER JOIN users c ON t.client_id = c.id
        LEFT JOIN users tech ON t.technician_id = tech.id
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY t.created_at DESC
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `;

      params.push(limit, offset);
    } else if (role === 'technician') {
      // Técnico: solo pendientes o tickets asignados al técnico autenticado.
      const whereClauses = ['(t.status = $1 OR t.technician_id = $2)'];
      params = ['pending', userId];

      if (statusFilters.length > 0) {
        params.push(statusFilters);
        whereClauses.push(`t.status = ANY($${params.length})`);
      }

      sqlQuery = `
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.category,
          t.client_id,
          t.technician_id,
          t.created_at,
          t.updated_at,
          t.attachment_url,
          t.attachment_url as file_url,
          c.name as client_name,
          c.email as client_email,
          tech.name as technician_name,
          tech.email as technician_email
        FROM tickets t
        INNER JOIN users c ON t.client_id = c.id
        LEFT JOIN users tech ON t.technician_id = tech.id
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY t.created_at DESC
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `;

      params.push(limit, offset);
    } else {
      return next(new AppError('Rol de usuario no válido para esta acción', 403));
    }

    if (role === 'client' && !userId) {
      return next(new AppError('ID de cliente no encontrado', 400));
    }

    const result = await query(sqlQuery, params);

    logger.info(
      {
        ...logContext,
        action: 'list_tickets',
        count: result.rows.length,
      },
      'Tickets consultados'
    );

    return sendSuccess(res, {
      data: { tickets: result.rows },
      legacy: { tickets: result.rows },
    });
  } catch (error) {
    logControllerError(req, 'list_tickets', error);
    next(error);
  }
};

/**
 * GET /api/tickets/available
 * Listar tickets disponibles (status = 'pending')
 * Requiere: verifyToken, isTechnician
 */
export const getAvailableTickets = async (req, res, next) => {
  try {
    const logContext = getRequestLogContext(req);
    const { limit, offset } = parsePagination(req);

    const sqlQuery = `
      SELECT 
        t.*,
        u.name as client_name,
        u.email as client_email
      FROM tickets t
      INNER JOIN users u ON t.client_id = u.id
      WHERE t.status = 'pending'
      ORDER BY t.created_at DESC
      LIMIT $1
      OFFSET $2
    `;

    const result = await query(sqlQuery, [limit, offset]);

    logger.info(
      {
        ...logContext,
        action: 'list_available_tickets',
        count: result.rows.length,
      },
      'Tickets disponibles consultados'
    );

    return sendSuccess(res, {
      data: { tickets: result.rows },
      legacy: { tickets: result.rows },
    });
  } catch (error) {
    logControllerError(req, 'list_available_tickets', error);
    next(error);
  }
};
/**
 * GET /api/tickets/my-tickets
 * Listar tickets del t�cnico autenticado (assigned, in_progress)
 * Requiere: verifyToken, isTechnician
 */
export const getMyTickets = async (req, res, next) => {
  try {
    const logContext = getRequestLogContext(req);
    if (!req.user) {
      return next(new AppError('No autorizado', 401));
    }

    if (req.user.role !== 'technician') {
      return next(new AppError('Acceso denegado: solo técnicos', 403));
    }

    const technicianId = req.user.userId ?? req.user.id;
    const { limit, offset } = parsePagination(req);
    const statusParam = typeof req.query.status === 'string' ? req.query.status : '';
    const statusFilters = statusParam
      ? statusParam
        .split(',')
        .map((status) => status.trim())
        .filter(Boolean)
      : ['assigned', 'in_progress'];
    const validStatuses = ['pending', 'assigned', 'in_progress', 'resolved', 'cancelled'];

    if (statusFilters.some((status) => !validStatuses.includes(status))) {
      return next(new AppError('Filtro de estado no válido', 400));
    }

    const sqlQuery = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.category,
        t.client_id,
        t.technician_id,
        t.created_at,
        t.updated_at,
          t.attachment_url,
          t.attachment_url as file_url,
        c.name as client_name,
        c.email as client_email,
        tech.name as technician_name,
        tech.email as technician_email
      FROM tickets t
      INNER JOIN users c ON t.client_id = c.id
      LEFT JOIN users tech ON t.technician_id = tech.id
      WHERE t.technician_id = $1
        AND t.status = ANY($2)
      ORDER BY t.created_at DESC
      LIMIT $3
      OFFSET $4
    `;

    const result = await query(sqlQuery, [technicianId, statusFilters, limit, offset]);

    logger.info(
      {
        ...logContext,
        action: 'list_my_tickets',
        count: result.rows.length,
      },
      'Mis tickets consultados'
    );

    return sendSuccess(res, {
      data: { tickets: result.rows },
      legacy: { tickets: result.rows },
    });
  } catch (error) {
    logControllerError(req, 'list_my_tickets', error);
    next(error);
  }
};

/**
 * GET /api/tickets/:id
 * Obtener detalle de un ticket
 * Cliente: solo si es su ticket
 * Técnico: pendientes o asignados al técnico autenticado
 * Requiere: verifyToken
 */
export const getTicketById = async (req, res, next) => {
  try {
    const logContext = getRequestLogContext(req, { ticketId: req.params?.id ?? null });
    const { id } = req.params;
    const role = req.user.role;
    const userId = req.user.userId ?? req.user.id;

    // Buscar ticket con informacion del cliente y tecnico
    const sqlQuery = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.category,
        t.client_id,
        t.technician_id,
        t.created_at,
        t.updated_at,
          t.attachment_url,
        t.attachment_url as file_url,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        tech.name as technician_name,
        tech.email as technician_email,
        tech.phone as technician_phone,
        tech.address as technician_address
      FROM tickets t
      INNER JOIN users c ON t.client_id = c.id
      LEFT JOIN users tech ON t.technician_id = tech.id
      WHERE t.id = $1
    `;

    const result = await query(sqlQuery, [id]);

    // Verificar si el ticket existe
    if (result.rows.length === 0) {
      return next(new AppError('Ticket no encontrado', 404));
    }

    const ticket = result.rows[0];

    // Verificar permisos por rol
    if (role === 'client' && ticket.client_id !== userId) {
      logSecurityEvent(req, 'unauthorized_ticket_access', { role, ownerId: ticket.client_id });
      return next(new AppError('No tienes permiso para ver este ticket', 403));
    }
    if (role === 'technician' && ticket.status !== 'pending' && ticket.technician_id !== userId) {
      logSecurityEvent(req, 'unauthorized_ticket_access', {
        role,
        ticketStatus: ticket.status,
        ticketTechnicianId: ticket.technician_id,
      });
      return next(new AppError('No tienes permiso para ver este ticket', 403));
    }

    logger.info(
      {
        ...logContext,
        action: 'get_ticket_by_id',
      },
      'Detalle de ticket consultado'
    );

    const {
      client_phone,
      technician_phone,
      technician_address,
      ...safeTicket
    } = ticket;

    const ticketResponse = canViewContactInfo(req.user, ticket)
      ? {
          ...safeTicket,
          contactInfo: {
            clientPhone: req.user.role === 'technician' ? client_phone ?? null : null,
            technicianPhone: req.user.role === 'client' ? technician_phone ?? null : null,
            technicianAddress: req.user.role === 'client' ? technician_address ?? null : null,
          },
        }
      : safeTicket;

    return sendSuccess(res, {
      data: { ticket: ticketResponse },
      legacy: { ticket: ticketResponse },
    });
  } catch (error) {
    logControllerError(req, 'get_ticket_by_id', error);
    next(error);
  }
};

/**
 * PUT /api/tickets/:id
 * Actualizar ticket (technician_id)
 * Solo tecnicos
 * Requiere: verifyToken, isTechnician
 */
export const updateTicket = async (req, res, next) => {
  try {
    const logContext = getRequestLogContext(req, { ticketId: req.params?.id ?? null });
    const { id } = req.params;
    const { technician_id } = req.body;
    const allowedFields = new Set(['technician_id']);
    const payloadFields = Object.keys(req.body || {});
    const blockedFields = payloadFields.filter((field) => !allowedFields.has(field));
    if (blockedFields.length > 0) {
      return next(new AppError('Se enviaron campos no permitidos para actualizar', 400));
    }

    if (technician_id === undefined) {
      return next(new AppError('No se proporcionaron campos para actualizar', 400));
    }

    const checkQuery = `
      SELECT id, status, technician_id
      FROM tickets
      WHERE id = $1
    `;
    const checkResult = await query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return next(new AppError('Ticket no encontrado', 404));
    }

    const currentTicket = checkResult.rows[0];
    assertTicketStatusIntegrity(currentTicket);
    assertTechnicianOwnership(req, currentTicket, {
      allowPendingTake: false,
      deniedAction: 'unauthorized_ticket_access',
    });

    const nextTechnicianId = technician_id ?? null;

    if (nextTechnicianId !== currentTicket.technician_id) {
      logSecurityEvent(req, 'unauthorized_ticket_access', {
        reason: 'arbitrary_technician_change_blocked',
        currentTechnicianId: currentTicket.technician_id,
        requestedTechnicianId: nextTechnicianId,
      });
      return next(new AppError('No se permite cambiar technician_id por este endpoint', 400));
    }

    assertTicketStatusIntegrity({
      status: currentTicket.status,
      technician_id: nextTechnicianId,
    });

    const sqlQuery = `
      UPDATE tickets
      SET technician_id = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(sqlQuery, [nextTechnicianId, id]);
    const ticket = result.rows[0];

    logger.info(
      {
        ...logContext,
        previousTechnicianId: currentTicket.technician_id,
        nextTechnicianId,
        action: 'update_ticket',
      },
      'Ticket actualizado'
    );

    return sendSuccess(res, {
      message: 'Ticket actualizado exitosamente',
      data: { ticket },
      legacy: { ticket },
    });
  } catch (error) {
    logControllerError(req, 'update_ticket', error);
    next(error);
  }
};

/**
 * PATCH /api/tickets/:id/assign
 * Asignar ticket a t�cnico
 * Body: { technicianId } (opcional, si no se env�a, se autoasigna)
 * Requiere: verifyToken, isTechnician
 */
export const assignTicket = async (req, res, next) => {
  try {
    const logContext = getRequestLogContext(req, { ticketId: req.params?.id ?? null });
    const { id } = req.params;
    const { technicianId } = req.body;
    const assignedTechnicianId = req.user.userId;

    // Solo se permite autoasignación al técnico autenticado.
    if (technicianId && technicianId !== assignedTechnicianId) {
      logger.warn(
        {
          ...logContext,
          action: 'unauthorized_assign_attempt',
          requestedTechnicianId: technicianId,
          authenticatedTechnicianId: assignedTechnicianId,
        },
        'Intento de asignación a técnico distinto al autenticado'
      );
      return next(new AppError('No autorizado para asignar este ticket', 403));
    }

    const ticketResult = await query(
      `SELECT id, status, technician_id
       FROM tickets
       WHERE id = $1`,
      [id]
    );

    if (ticketResult.rows.length === 0) {
      return next(new AppError('Ticket no encontrado', 404));
    }

    const currentTicket = ticketResult.rows[0];
    assertTicketStatusIntegrity(currentTicket);

    if (currentTicket.status !== 'pending' || currentTicket.technician_id !== null) {
      logger.warn(
        {
          ...logContext,
          action: 'unauthorized_assign_attempt',
          ticketStatus: currentTicket.status,
          ticketTechnicianId: currentTicket.technician_id,
        },
        'Intento de tomar ticket no disponible'
      );
      return next(new AppError('El ticket ya fue tomado por otro técnico', 403));
    }

    const sqlQuery = `
      UPDATE tickets
      SET 
        technician_id = $1,
        status = 'assigned',
        updated_at = NOW()
      WHERE id = $2
        AND status = 'pending'
        AND technician_id IS NULL
      RETURNING *
    `;

    const result = await query(sqlQuery, [assignedTechnicianId, id]);

    if (result.rows.length === 0) {
      logger.warn(
        {
          ...logContext,
          action: 'unauthorized_assign_attempt',
          ticketStatus: currentTicket.status,
          ticketTechnicianId: currentTicket.technician_id,
        },
        'Condición de carrera al tomar ticket'
      );
      return next(new AppError('El ticket ya fue tomado por otro técnico', 403));
    }

    const ticket = result.rows[0];
    assertTicketStatusIntegrity(ticket);
    const technicianName = await resolveTechnicianName(assignedTechnicianId);
    await createSystemMessage(
      ticket.id,
      `Técnico ${technicianName} ha sido asignado`,
      'TECHNICIAN_ASSIGNED',
      logContext.requestId
    );

    try {
      const io = getIO();
      const actorId = req.user.userId ?? req.user.id;
      io.emit('ticketAssigned', { ticket, actorId });
      io.emit('ticket:assigned', ticket);
    } catch (socketError) {
      logger.error(
        { ...logContext, action: 'assign_ticket', event: 'ticketAssigned', err: socketError },
        'Socket emit error'
      );
    }

    logger.info(
      {
        ...logContext,
        action: 'assign_ticket',
      },
      'Ticket asignado'
    );

    return sendSuccess(res, {
      message: 'Ticket asignado exitosamente',
      data: { ticket },
      legacy: { ticket },
    });
  } catch (error) {
    logControllerError(req, 'assign_ticket', error);
    next(error);
  }
};

/**
 * PATCH /api/tickets/:id/status
 * Cambiar estado del ticket
 * Body: { status } (pending, assigned, in_progress, resolved)
 * Requiere: verifyToken, isTechnician
 */
export const updateStatus = async (req, res, next) => {
  try {
    const logContext = getRequestLogContext(req, { ticketId: req.params?.id ?? null });
    const { id } = req.params;
    const { status } = req.body;

    // Validar que se proporcion� el estado
    if (!status) {
      return next(new AppError('El estado es obligatorio', 400));
    }

    // Validar que el estado sea válido
    const validStatuses = ['pending', 'assigned', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return next(new AppError('Estado no válido', 400));
    }

    // Verificar que el ticket existe
    const checkQuery = `
      SELECT id, status, technician_id
      FROM tickets
      WHERE id = $1
    `;
    const checkResult = await query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return next(new AppError('Ticket no encontrado', 404));
    }

    const currentTicket = checkResult.rows[0];
    const previousStatus = currentTicket.status;
    assertTicketStatusIntegrity(currentTicket);
    assertTechnicianOwnership(req, currentTicket, {
      allowPendingTake: false,
      deniedAction: 'unauthorized_status_change',
    });

    const allowedTransitions = {
      pending: [],
      assigned: ['in_progress'],
      in_progress: ['resolved'],
      resolved: [],
      cancelled: [],
    };
    const allowedNextStatuses = allowedTransitions[previousStatus] || [];

    if (!allowedNextStatuses.includes(status)) {
      logSecurityEvent(req, 'unauthorized_status_change', {
        previousStatus,
        requestedStatus: status,
      });
      return next(
        new AppError(
          `Transición de estado no permitida: ${previousStatus} -> ${status}`,
          400
        )
      );
    }

    const nextTechnicianId = currentTicket.technician_id;

    assertTicketStatusIntegrity({
      status,
      technician_id: nextTechnicianId,
    });

    const sqlQuery = `
      UPDATE tickets
      SET
        status = $1,
        technician_id = technician_id,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(sqlQuery, [status, id]);
    const ticket = result.rows[0];
    assertTicketStatusIntegrity(ticket);
    await createSystemMessage(
      ticket.id,
      `El ticket cambió a ${status}`,
      'STATUS_CHANGED',
      logContext.requestId
    );

    try {
      const io = getIO();
      io.emit('ticket:statusUpdated', ticket);
      if (ticket.status === 'resolved' && previousStatus !== 'resolved') {
        const actorId = req.user.userId ?? req.user.id;
        io.emit('ticketResolved', { ticket, actorId });
      }
    } catch (socketError) {
      logger.error(
        { ...logContext, action: 'update_ticket_status', event: 'ticketResolved', err: socketError },
        'Socket emit error'
      );
    }

    logger.info(
      {
        ...logContext,
        action: 'update_ticket_status',
        nextStatus: ticket.status,
      },
      'Estado de ticket actualizado'
    );

    return sendSuccess(res, {
      message: 'Estado actualizado exitosamente',
      data: { ticket },
      legacy: { ticket },
    });
  } catch (error) {
    logControllerError(req, 'update_ticket_status', error);
    next(error);
  }
};


/**
 * GET /api/tickets/:id/messages
 * Obtener mensajes de un ticket
 * Cliente/T�cnico debe ser parte del ticket
 * Requiere: verifyToken
 */
export const getTicketMessages = async (req, res, next) => {
  try {
    const logContext = getRequestLogContext(req, { ticketId: req.params?.id ?? null });
    const { id } = req.params;
    const { userId } = req.user;

    const ticketResult = await query(
      `SELECT client_id, technician_id, status FROM tickets WHERE id = $1`,
      [id]
    );

    if (ticketResult.rows.length === 0) {
      return next(new AppError('Ticket no encontrado', 404));
    }

    const ticket = ticketResult.rows[0];
    if (ticket.client_id !== userId && ticket.technician_id !== userId) {
      logSecurityEvent(req, 'unauthorized_ticket_access', {
        role: req.user?.role ?? null,
        ticketStatus: ticket.status,
        ticketTechnicianId: ticket.technician_id,
      });
      return next(new AppError('No tienes permiso para ver estos mensajes', 403));
    }

    const messagesQuery = `
      SELECT
        tm.id,
        tm.ticket_id,
        tm.sender_id,
        tm.message,
        tm.type,
        tm.system_event,
        tm.is_system,
        tm.created_at,
        tm.attachment_url as file_url,
        u.name as sender_name,
        u.role as sender_role
      FROM ticket_messages tm
      LEFT JOIN users u ON tm.sender_id = u.id
      WHERE tm.ticket_id = $1
      ORDER BY tm.created_at ASC
    `;
    const result = await query(messagesQuery, [id]);

    logger.info(
      {
        ...logContext,
        action: 'get_ticket_messages',
        count: result.rows.length,
      },
      'Mensajes del ticket consultados'
    );

    return sendSuccess(res, {
      data: { messages: result.rows },
      legacy: { messages: result.rows },
    });
  } catch (error) {
    logControllerError(req, 'get_ticket_messages', error);
    next(error);
  }
};

/**
 * POST /api/tickets/:id/messages
 * Crear mensaje en ticket
 * Requiere: verifyToken
 */
export const createTicketMessage = async (req, res, next) => {
  try {
    const logContext = getRequestLogContext(req, { ticketId: req.params?.id ?? null });
    const { id } = req.params;
    const {
      message,
      file_url,
      fileUrl,
      attachment_url,
      attachmentUrl,
    } = req.body;
    const sender_id = req.user.userId;
    const uploadedSingleFile = req.file || null;
    const uploadedFiles = Array.isArray(req.files) ? req.files : [];

    const hasText = typeof message === 'string' && message.trim().length > 0;
    const hasFile =
      Boolean(uploadedSingleFile) ||
      uploadedFiles.length > 0 ||
      Boolean(file_url) ||
      Boolean(fileUrl) ||
      Boolean(attachment_url) ||
      Boolean(attachmentUrl);

    logger.info(
      {
        ...logContext,
        userId: sender_id,
        action: 'create_ticket_message',
        file: uploadedSingleFile
          ? {
              filename: uploadedSingleFile.filename,
              mimetype: uploadedSingleFile.mimetype,
              size: uploadedSingleFile.size,
            }
          : null,
        filesCount: uploadedFiles.length,
        hasText,
        hasFile,
      },
      'Procesando mensaje'
    );

    if (!hasText && !hasFile) {
      return next(new AppError('El mensaje no puede estar vacío', 400));
    }

    const uploadedFileUrl = uploadedSingleFile
      ? `/uploads/${uploadedSingleFile.filename}`
      : uploadedFiles[0]?.filename
        ? `/uploads/${uploadedFiles[0].filename}`
        : null;
    const resolvedFileUrl =
      uploadedFileUrl || file_url || fileUrl || attachment_url || attachmentUrl || null;

    const ticketFromMiddleware = req.ticketContext ?? null;
    const ticket =
      ticketFromMiddleware ||
      (
        await query(
          `SELECT id, status, client_id, technician_id FROM tickets WHERE id = $1`,
          [id]
        )
      ).rows[0];

    if (!ticket) {
      return next(new AppError('Ticket no encontrado', 404));
    }

    if (CLOSED_CHAT_STATUSES.has(ticket.status)) {
      logger.warn(
        {
          ...logContext,
          action: 'chat_blocked_ticket_closed',
          status: ticket.status,
        },
        'Intento de mensaje bloqueado por ticket cerrado'
      );
      return next(new AppError('El ticket está cerrado y no permite nuevos mensajes', 403));
    }

    if (!canUserInteractWithTicket(sender_id, ticket)) {
      logger.warn(
        {
          ...logContext,
          action: 'unauthorized_chat_attempt',
          ticketStatus: ticket.status,
          technicianId: ticket.technician_id,
        },
        'Intento no autorizado de envio de mensaje en ticket'
      );
      return next(new AppError('No autorizado para enviar mensajes en este ticket', 403));
    }

    const insertQuery = `
      INSERT INTO ticket_messages (ticket_id, sender_id, message, attachment_url, type, system_event, is_system)
      VALUES ($1, $2, $3, $4, 'text', NULL, false)
      RETURNING *
    `;
    const insertResult = await query(insertQuery, [
      id,
      sender_id,
      hasText ? message.trim() : null,
      resolvedFileUrl,
    ]);
    const createdMessage = insertResult.rows[0];

    const payloadMessage = {
      ...createdMessage,
      file_url: createdMessage?.attachment_url || null,
      fileUrl: createdMessage?.attachment_url || null,
      attachment_url: createdMessage?.attachment_url || null,
      type: createdMessage?.type || (createdMessage?.attachment_url ? 'image' : 'text'),
      system_event: createdMessage?.system_event || null,
      ticketId: createdMessage?.ticket_id,
      userId: createdMessage?.sender_id,
      senderId: createdMessage?.sender_id, // Compatibilidad temporal
      content: createdMessage?.message,
      createdAt: createdMessage?.created_at,
    };

    try {
      const io = getIO();
      io.to(`ticket:${id}`).emit('message:new', {
        ...payloadMessage,
        requestId: logContext.requestId,
      });
      logger.info(
        {
          ...logContext,
          action: 'create_ticket_message',
          messageId: payloadMessage.id,
        },
        'Mensaje creado por HTTP y emitido por socket'
      );
    } catch (socketError) {
      logger.error({ err: socketError, ...logContext, event: 'message:new' }, 'Socket emit error en createTicketMessage');
    }

    return sendSuccess(res, {
      status: 201,
      message: 'Mensaje enviado exitosamente',
      data: { message: payloadMessage },
      legacy: { ticketMessage: payloadMessage },
    });
  } catch (error) {
    logControllerError(req, 'create_ticket_message', error);
    next(error);
  }
};

/**
 * PATCH /api/tickets/:id/cancel
 * Cancelar ticket (solo cliente)
 * Requiere: verifyToken, isClient
 */
export const cancelTicket = async (req, res, next) => {
  try {
    const logContext = getRequestLogContext(req, { ticketId: req.params?.id ?? null });
    const { id } = req.params;
    const clientId = req.user?.userId ?? req.user?.id;

    if (!clientId) {
      return next(new AppError('No autorizado', 401));
    }

    const ticketResult = await query(
      `SELECT id, client_id, status FROM tickets WHERE id = $1`,
      [id]
    );

    if (ticketResult.rows.length === 0) {
      return next(new AppError('Ticket no encontrado', 404));
    }

    const ticket = ticketResult.rows[0];

    if (ticket.client_id !== clientId) {
      return next(new AppError('No tienes permiso para cancelar este ticket', 403));
    }

    if (['resolved', 'cancelled'].includes(ticket.status)) {
      return next(new AppError('No se puede cancelar un ticket resuelto o ya cancelado', 400));
    }

    const updateQuery = `
      UPDATE tickets
      SET status = 'cancelled', technician_id = NULL, updated_at = NOW()
      WHERE id = $1
        AND status NOT IN ('resolved', 'cancelled')
      RETURNING *
    `;

    const result = await query(updateQuery, [id]);

    if (result.rows.length === 0) {
      return next(new AppError('No se pudo cancelar el ticket', 400));
    }

    const updatedTicket = result.rows[0];

    try {
      const io = getIO();
      const actorId = clientId;
      io.emit('ticketCancelled', { ticket: updatedTicket, actorId });
      io.emit('ticket:cancelled', updatedTicket);
    } catch (socketError) {
      logger.error(
        { ...logContext, action: 'cancel_ticket', event: 'ticketCancelled', err: socketError },
        'Socket emit error'
      );
    }

    logger.info(
      {
        ...logContext,
        action: 'cancel_ticket',
      },
      'Ticket cancelado'
    );

    return sendSuccess(res, {
      message: 'Ticket cancelado exitosamente',
      data: { ticket: updatedTicket },
      legacy: { ticket: updatedTicket },
    });
  } catch (error) {
    logControllerError(req, 'cancel_ticket', error);
    next(error);
  }
};

/**
 * PATCH /api/tickets/:id/release
 * Liberar ticket (solo t�cnico asignado)
 * Requiere: verifyToken, isTechnician
 */
export const releaseTicket = async (req, res, next) => {
  try {
    const logContext = getRequestLogContext(req, { ticketId: req.params?.id ?? null });
    const { id } = req.params;
    const technicianId = req.user.userId;

    const ticketResult = await query(
      `SELECT id, status, technician_id
       FROM tickets
       WHERE id = $1`,
      [id]
    );

    if (ticketResult.rows.length === 0) {
      return next(new AppError('Ticket no encontrado', 404));
    }

    const currentTicket = ticketResult.rows[0];
    assertTicketStatusIntegrity(currentTicket);
    assertTechnicianOwnership(req, currentTicket, {
      allowPendingTake: false,
      deniedAction: 'unauthorized_ticket_access',
    });

    const updateQuery = `
      UPDATE tickets
      SET technician_id = NULL, status = 'pending'
      WHERE id = $1
        AND technician_id = $2
        AND status IN ('assigned', 'in_progress')
      RETURNING *
    `;

    const result = await query(updateQuery, [id, technicianId]);

    if (result.rows.length === 0) {
      return next(new AppError('No puedes liberar este ticket', 403));
    }

    assertTicketStatusIntegrity(result.rows[0]);
    const technicianName = await resolveTechnicianName(technicianId);
    await createSystemMessage(
      id,
      `Técnico ${technicianName} ha liberado el ticket`,
      'TECHNICIAN_RELEASED',
      logContext.requestId
    );

    try {
      const io = getIO();
      const actorId = technicianId;
      io.emit('ticketReleased', { ticket: result.rows[0], actorId });
      io.emit('ticket:released', result.rows[0]);
    } catch (socketError) {
      logger.error(
        { ...logContext, action: 'release_ticket', event: 'ticketReleased', err: socketError },
        'Socket emit error'
      );
    }

    logger.info(
      {
        ...logContext,
        action: 'release_ticket',
      },
      'Ticket liberado'
    );

    return sendSuccess(res, {
      message: 'Ticket liberado exitosamente',
      data: { ticket: result.rows[0] },
      legacy: { ticket: result.rows[0] },
    });
  } catch (error) {
    logControllerError(req, 'release_ticket', error);
    next(error);
  }
};

