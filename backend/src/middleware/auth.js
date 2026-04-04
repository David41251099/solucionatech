/**
 * auth.js
 * Middleware de autenticacion y autorizacion
 *
 * Funciones:
 * - verifyToken: Verifica JWT en headers
 * - isClient: Verifica que el usuario sea cliente
 * - isTechnician: Verifica que el usuario sea tecnico
 * - checkRole: Verifica roles especificos
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger.js';
import { errorResponse } from '../utils/httpResponses.js';

/**
 * Middleware para verificar JWT
 * Extrae el token del header Authorization
 * Decodifica y adjunta el usuario a req.user
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return errorResponse(res, 'Token no proporcionado', 401);
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return errorResponse(res, 'Formato de token invalido. Use: Bearer TOKEN', 401);
    }

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    if (!req.context) {
      req.context = { requestId: req.requestId ?? null, userId: null };
    }
    req.context.userId = decoded.userId;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expirado', 401);
    }

    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Token invalido', 401);
    }

    logger.error(
      { err: error, requestId: req.context?.requestId ?? req.requestId ?? `http-${crypto.randomUUID()}` },
      'Error en verifyToken'
    );
    return errorResponse(res, 'Error al verificar token', 401);
  }
};

/**
 * Middleware para verificar que el usuario sea tecnico
 * DEBE usarse DESPUES de verifyToken
 */
export const isTechnician = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'No autenticado. Use verifyToken primero', 401);
  }

  if (req.user.role !== 'technician') {
    return errorResponse(res, 'Acceso denegado. Se requiere rol de tecnico', 403);
  }

  next();
};

/**
 * Middleware para verificar que el usuario sea cliente
 * DEBE usarse DESPUES de verifyToken
 */
export const isClient = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'No autenticado. Use verifyToken primero', 401);
  }

  if (req.user.role !== 'client') {
    return errorResponse(res, 'Acceso denegado. Se requiere rol de cliente', 403);
  }

  next();
};

/**
 * Middleware generico para verificar roles
 * DEBE usarse DESPUES de verifyToken
 *
 * Uso: checkRole('client', 'technician')
 */
export const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'No autenticado. Use verifyToken primero', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}`,
        403
      );
    }

    next();
  };
};
