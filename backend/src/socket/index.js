import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { query } from '../config/database.js';
import { logger } from '../config/logger.js';
import { canUserInteractWithTicket } from '../middleware/ticketAccess.js';

let io;
const SOCKET_EVENTS = {
  TICKET_JOIN: 'ticket:join',
  TICKET_LEAVE: 'ticket:leave',
  MESSAGE_SEND: 'message:send',
  MESSAGE_NEW: 'message:new',
  SOCKET_ERROR: 'socket:error',
  LEGACY_TICKET_JOIN: 'join_ticket',
  LEGACY_TICKET_LEAVE: 'leave_ticket',
};

const EVENT_LIMITS = {
  [SOCKET_EVENTS.MESSAGE_SEND]: { limit: 10, windowMs: 5000 },
};

const eventWindows = new Map();

const getRoomName = (ticketId) => `ticket:${ticketId}`;
const inferMessageType = (fileUrl) => {
  return fileUrl ? 'image' : 'text';
};

const resolveRequestId = (incomingRequestId) => {
  if (typeof incomingRequestId === 'string' && incomingRequestId.trim()) {
    return incomingRequestId.trim();
  }

  return `socket-${crypto.randomUUID()}`;
};

const canAccessTicket = async (ticketId, userId) => {
  const result = await query(
    `SELECT id
     FROM tickets
     WHERE id = $1
       AND (client_id = $2 OR technician_id = $2)`,
    [ticketId, userId]
  );

  return result.rows.length > 0;
};

const normalizeTicketId = (payload) => {
  if (!payload) return null;
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'object' && payload.ticketId) return payload.ticketId;
  return null;
};

const ackSuccess = (ack, data = {}, message = 'OK') => {
  if (typeof ack === 'function') {
    ack({ success: true, data, message });
  }
};

const ackError = (ack, message = 'Error', data = {}) => {
  if (typeof ack === 'function') {
    ack({ success: false, message, data });
  }
};

const isRateLimited = (userId, eventName) => {
  const config = EVENT_LIMITS[eventName];
  if (!config || !userId) return { limited: false, retryAfterMs: 0 };

  const key = `${userId}:${eventName}`;
  const now = Date.now();
  const history = eventWindows.get(key) ?? [];
  const recent = history.filter((timestamp) => now - timestamp < config.windowMs);

  if (recent.length >= config.limit) {
    const oldest = recent[0];
    const retryAfterMs = Math.max(config.windowMs - (now - oldest), 0);
    eventWindows.set(key, recent);
    return { limited: true, retryAfterMs };
  }

  recent.push(now);
  eventWindows.set(key, recent);
  return { limited: false, retryAfterMs: 0 };
};

const extractSocketToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const authHeader = socket.handshake.headers?.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }

  return null;
};

export const initSocket = (server) => {
  const isProd = process.env.NODE_ENV === 'production';
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          (!isProd && /^http:\/\/localhost:\d+$/.test(origin))
        ) {
          callback(null, true);
          return;
        }

        callback(new Error('Origen no permitido por CORS'));
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const requestId = resolveRequestId();
    try {
      const token = extractSocketToken(socket);

      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded?.userId ?? decoded?.id;

      if (!userId) {
        return next(new Error('Unauthorized'));
      }

      socket.user = {
        id: userId,
        role: decoded?.role,
      };
      socket.context = {
        userId,
        socketId: socket.id,
      };

      return next();
    } catch (error) {
      logger.error({ err: error, requestId, socketId: socket.id, event: 'socket:auth' }, 'Socket auth error');
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const connectionRequestId = resolveRequestId();
    logger.info(
      {
        requestId: connectionRequestId,
        event: 'socket:connect',
        socketId: socket.id,
        userId: socket.context?.userId ?? socket.user?.id,
        role: socket.user?.role,
      },
      'Socket conectado'
    );

    const handleJoinTicket = async (payload, ack) => {
      const requestId = resolveRequestId(payload?.requestId);
      try {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          ackError(ack, 'Payload invalido para ticket:join');
          return;
        }

        const ticketId = normalizeTicketId(payload);
        const currentUserId = socket.context?.userId ?? socket.user?.id;
        if (!ticketId || !currentUserId) {
          logger.warn(
            {
              event: SOCKET_EVENTS.TICKET_JOIN,
              requestId,
              socketId: socket.id,
              userId: currentUserId,
              payload,
            },
            '[socket] ticket:join rechazado: ticketId ausente o usuario no autenticado'
          );
          ackError(ack, 'ticketId requerido');
          return;
        }

        const userId = currentUserId;
        const allowed = await canAccessTicket(ticketId, userId);

        if (!allowed) {
          logger.warn(
            {
              event: SOCKET_EVENTS.TICKET_JOIN,
              requestId,
              socketId: socket.id,
              userId,
              ticketId,
            },
            'Intento no autorizado de join a ticket'
          );

          socket.emit(SOCKET_EVENTS.SOCKET_ERROR, {
            event: SOCKET_EVENTS.TICKET_JOIN,
            message: 'No autorizado para este ticket',
          });
          ackError(ack, 'No autorizado para este ticket');
          return;
        }

        socket.join(getRoomName(ticketId));
        logger.info({ event: SOCKET_EVENTS.TICKET_JOIN, requestId, socketId: socket.id, userId, ticketId }, 'Join ticket');
        ackSuccess(ack, { ticketId }, 'Unido al ticket');
      } catch (error) {
        logger.error({ err: error, event: SOCKET_EVENTS.TICKET_JOIN, requestId, socketId: socket.id, userId: socket.context?.userId ?? socket.user?.id, ticketId: payload?.ticketId ?? null }, 'Error en ticket:join');
        ackError(ack, 'Error en ticket:join');
      }
    };

    const handleLeaveTicket = async (payload, ack) => {
      const requestId = resolveRequestId(payload?.requestId);
      try {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          ackError(ack, 'Payload invalido para ticket:leave');
          return;
        }

        const ticketId = normalizeTicketId(payload);
        const currentUserId = socket.context?.userId ?? socket.user?.id;
        if (!ticketId || !currentUserId) {
          logger.warn(
            {
              event: SOCKET_EVENTS.TICKET_LEAVE,
              requestId,
              socketId: socket.id,
              userId: currentUserId,
              payload,
            },
            '[socket] ticket:leave rechazado: ticketId ausente o usuario no autenticado'
          );
          ackError(ack, 'ticketId requerido');
          return;
        }

        const userId = currentUserId;
        const allowed = await canAccessTicket(ticketId, userId);
        if (!allowed) {
          logger.warn(
            {
              event: SOCKET_EVENTS.TICKET_LEAVE,
              requestId,
              socketId: socket.id,
              userId,
              ticketId,
            },
            'Intento no autorizado de leave a ticket'
          );
          ackError(ack, 'No autorizado para este ticket');
          return;
        }

        socket.leave(getRoomName(ticketId));
        logger.info(
          { event: SOCKET_EVENTS.TICKET_LEAVE, requestId, socketId: socket.id, userId, ticketId },
          'Leave ticket'
        );
        ackSuccess(ack, { ticketId }, 'Salida del ticket confirmada');
      } catch (error) {
        logger.error({ err: error, event: SOCKET_EVENTS.TICKET_LEAVE, requestId, socketId: socket.id, userId: socket.context?.userId ?? socket.user?.id, ticketId: payload?.ticketId ?? null }, 'Error en ticket:leave');
        ackError(ack, 'Error en ticket:leave');
      }
    };

    socket.on(SOCKET_EVENTS.TICKET_JOIN, handleJoinTicket);
    socket.on(SOCKET_EVENTS.TICKET_LEAVE, handleLeaveTicket);

    socket.on(SOCKET_EVENTS.LEGACY_TICKET_JOIN, (legacyPayload, ack) => {
      const requestId = resolveRequestId();
      const ticketId = normalizeTicketId(legacyPayload);
      logger.warn(
        {
          event: SOCKET_EVENTS.LEGACY_TICKET_JOIN,
          requestId,
          socketId: socket.id,
          userId: socket.context?.userId ?? socket.user?.id,
          ticketId,
        },
        `[socket] Evento legado '${SOCKET_EVENTS.LEGACY_TICKET_JOIN}' recibido. Migrar a '${SOCKET_EVENTS.TICKET_JOIN}'.`
      );
      handleJoinTicket({ ticketId, requestId }, ack);
    });

    socket.on(SOCKET_EVENTS.LEGACY_TICKET_LEAVE, (legacyPayload, ack) => {
      const requestId = resolveRequestId();
      const ticketId = normalizeTicketId(legacyPayload);
      logger.warn(
        {
          event: SOCKET_EVENTS.LEGACY_TICKET_LEAVE,
          requestId,
          socketId: socket.id,
          userId: socket.context?.userId ?? socket.user?.id,
          ticketId,
        },
        `[socket] Evento legado '${SOCKET_EVENTS.LEGACY_TICKET_LEAVE}' recibido. Migrar a '${SOCKET_EVENTS.TICKET_LEAVE}'.`
      );
      handleLeaveTicket({ ticketId, requestId }, ack);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload = {}, ack) => {
      const requestId = resolveRequestId(payload?.requestId);
      try {
        const {
          ticketId,
          message,
          file,
          file_url,
          fileUrl,
          attachment_url,
          attachmentUrl,
        } = payload;
        const fileFromObject =
          typeof file === 'object' && file?.filename ? `/uploads/${file.filename}` : null;
        const resolvedFileUrl =
          file_url || fileUrl || attachment_url || attachmentUrl || fileFromObject || null;
        const userId = socket.context?.userId ?? socket.user?.id;

        if (!ticketId || !userId || ((!message || !message.trim()) && !resolvedFileUrl)) {
          logger.warn(
            {
              event: SOCKET_EVENTS.MESSAGE_SEND,
              socketId: socket.id,
              requestId,
              userId,
              ticketId,
              hasMessage: !!message?.trim(),
              hasFile: !!resolvedFileUrl,
            },
            '[socket] message:send rechazado: payload invalido'
          );
          ackError(ack, 'Payload invalido para message:send');
          return;
        }

        const rateState = isRateLimited(userId, SOCKET_EVENTS.MESSAGE_SEND);
        if (rateState.limited) {
          const retryAfterSeconds = Math.ceil(rateState.retryAfterMs / 1000);
          ackError(ack, `Rate limit excedido. Intenta de nuevo en ${retryAfterSeconds}s`, {
            retryAfterMs: rateState.retryAfterMs,
          });
          return;
        }

        const ticketResult = await query(
          `SELECT id, status, client_id, technician_id
           FROM tickets
           WHERE id = $1`,
          [ticketId]
        );

        if (ticketResult.rows.length === 0) {
          ackError(ack, 'Ticket no encontrado');
          return;
        }

        const ticket = ticketResult.rows[0];
        const allowed = canUserInteractWithTicket(userId, ticket);
        if (!allowed) {
          logger.warn(
            {
              action: 'unauthorized_chat_attempt',
              event: SOCKET_EVENTS.MESSAGE_SEND,
              socketId: socket.id,
              requestId,
              userId,
              ticketId,
              ticketStatus: ticket.status,
              technicianId: ticket.technician_id,
            },
            'Intento no autorizado de envio de mensaje'
          );

          socket.emit('error', { message: 'No autorizado' });
          socket.emit(SOCKET_EVENTS.SOCKET_ERROR, {
            event: SOCKET_EVENTS.MESSAGE_SEND,
            message: 'No autorizado para este ticket',
          });
          ackError(ack, 'No autorizado para este ticket');
          return;
        }

        const insertQuery = `
          INSERT INTO ticket_messages (ticket_id, sender_id, message, attachment_url, type, system_event, is_system)
          VALUES ($1, $2, $3, $4, 'text', NULL, false)
          RETURNING *
        `;

        const insertResult = await query(insertQuery, [
          ticketId,
          userId,
          message ? message.trim() : null,
          resolvedFileUrl,
        ]);

        const createdMessage = insertResult.rows[0];

        const enrichedQuery = `
          SELECT
            tm.id,
            tm.ticket_id,
            tm.sender_id,
            tm.message,
            tm.type,
            tm.system_event,
            tm.is_system,
            tm.created_at,
            tm.attachment_url,
            tm.attachment_url as file_url,
            u.name as sender_name,
            u.role as sender_role
          FROM ticket_messages tm
          LEFT JOIN users u ON tm.sender_id = u.id
          WHERE tm.id = $1
        `;

        const enrichedResult = await query(enrichedQuery, [createdMessage.id]);
        const rawMessage = enrichedResult.rows[0] || createdMessage;
        const normalizedFileUrl =
          rawMessage?.file_url || rawMessage?.attachment_url || resolvedFileUrl || null;
        const payloadToSend = {
          ...rawMessage,
          // Formato normalizado para frontend actual
          file_url: normalizedFileUrl,
          attachment_url: normalizedFileUrl,
          // Formato adicional solicitado (camelCase + type)
          ticketId: rawMessage.ticket_id,
          userId: rawMessage.sender_id,
          senderId: rawMessage.sender_id, // Compatibilidad temporal
          content: rawMessage.message,
          type: rawMessage.type || inferMessageType(normalizedFileUrl),
          fileUrl: normalizedFileUrl,
          system_event: rawMessage.system_event || null,
          createdAt: rawMessage.created_at,
          requestId,
        };

        io.to(getRoomName(ticketId)).emit(SOCKET_EVENTS.MESSAGE_NEW, payloadToSend);
        logger.info(
          {
            event: SOCKET_EVENTS.MESSAGE_SEND,
            socketId: socket.id,
            requestId,
            userId,
            ticketId,
            messageId: payloadToSend.id,
          },
          'Mensaje enviado por socket'
        );
        ackSuccess(ack, { message: payloadToSend }, 'Mensaje enviado');
      } catch (error) {
        logger.error({ err: error, event: SOCKET_EVENTS.MESSAGE_SEND, requestId, socketId: socket.id, userId: socket.context?.userId ?? socket.user?.id, ticketId: payload?.ticketId ?? null }, 'Socket message error');
        ackError(ack, 'Error al enviar mensaje');
      }
    });

    socket.on('disconnect', (reason) => {
      const requestId = resolveRequestId();
      logger.warn(
        {
          requestId,
          event: 'socket:disconnect',
          socketId: socket.id,
          userId: socket.context?.userId ?? socket.user?.id,
          reason,
        },
        'Socket desconectado'
      );
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO no inicializado');
  }

  return io;
};
