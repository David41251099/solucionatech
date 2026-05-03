/**
 * auth.controller.js
 * Controladores para autenticacion
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { logger } from '../config/logger.js';
import AppError from '../utils/AppError.js';
import { sendSuccess } from '../utils/httpResponses.js';

const SALT_ROUNDS = 10;

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const normalizeOptionalText = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const validatePhone = (phone) => {
  if (phone === null) {
    return null;
  }

  if (phone.length < 7 || phone.length > 20) {
    throw new AppError('El teléfono debe tener entre 7 y 20 caracteres', 400);
  }

  return phone;
};

const getRequestLogContext = (req) => ({
  requestId: req.context?.requestId ?? req.requestId ?? `http-${crypto.randomUUID()}`,
  userId: req.context?.userId ?? req.user?.userId ?? req.user?.id ?? null,
});

/**
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const logContext = getRequestLogContext(req);
    const { email, password, name, role, phone, address } = req.body;

    if (!email || !password || !name || !role) {
      return next(
        new AppError(
          'Todos los campos son requeridos: email, password, name, role',
          400
        )
      );
    }

    if (!isValidEmail(email)) {
      return next(new AppError('Email invalido', 400));
    }

    if (password.length < 6) {
      return next(new AppError('La contraseña debe tener al menos 6 caracteres', 400));
    }

    if (!['client', 'technician'].includes(role)) {
      return next(new AppError('El rol debe ser "client" o "technician"', 400));
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = validatePhone(normalizeOptionalText(phone));
    const normalizedAddress = normalizeOptionalText(address);

    if (role === 'technician' && !normalizedAddress) {
      return next(new AppError('La dirección es obligatoria para técnicos', 400));
    }

    const emailCheck = await query('SELECT id FROM users WHERE email = $1', [
      normalizedEmail,
    ]);

    if (emailCheck.rows.length > 0) {
      return next(new AppError('El email ya esta registrado', 409));
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    let result;
    try {
      result = await query(
        `INSERT INTO users (name, email, password, role, phone, address)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, email, role, phone, address, created_at`,
        [name.trim(), normalizedEmail, hashedPassword, role, normalizedPhone, normalizedAddress]
      );
    } catch (dbError) {
      if (dbError.code === '23505') {
        return next(new AppError('El email ya esta en uso', 409));
      }
      throw dbError;
    }

    const user = result.rows[0];
    if (!user) {
      return next(new AppError('No se pudo crear el usuario', 500));
    }

    const token = generateToken(user.id, user.role);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone ?? null,
      address: user.address ?? null,
      createdAt: user.created_at,
    };

    logger.info(
      {
        ...logContext,
        userId: safeUser.id,
        action: 'register',
      },
      'Usuario registrado'
    );

    return sendSuccess(res, {
      status: 201,
      message: 'Usuario registrado exitosamente',
      data: {
        user: safeUser,
        token,
      },
      legacy: {
        user: safeUser,
        token,
      },
    });
  } catch (error) {
    logger.error({ err: error, ...getRequestLogContext(req), action: 'register' }, 'Error en register');
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const logContext = getRequestLogContext(req);
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Email y contraseña son requeridos', 400));
    }

    const result = await query(
      'SELECT id, name, email, password, role, created_at FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Credenciales invalidas', 401));
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return next(new AppError('Credenciales invalidas', 401));
    }

    const token = generateToken(user.id, user.role);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    };

    logger.info(
      {
        ...logContext,
        userId: safeUser.id,
        action: 'login',
      },
      'Usuario autenticado'
    );

    return sendSuccess(res, {
      message: 'Login exitoso',
      data: {
        user: safeUser,
        token,
      },
    });
  } catch (error) {
    logger.error({ err: error, ...getRequestLogContext(req), action: 'login' }, 'Error en login');
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
export const getProfile = async (req, res, next) => {
  try {
    const logContext = getRequestLogContext(req);
    const userId = req.user.userId;

    const result = await query(
      'SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Usuario no encontrado', 404));
    }

    const user = result.rows[0];
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone ?? null,
      address: user.address ?? null,
      createdAt: user.created_at,
    };

    logger.info(
      {
        ...logContext,
        userId: safeUser.id,
        action: 'get_profile',
      },
      'Perfil consultado'
    );

    return sendSuccess(res, {
      data: { user: safeUser },
      legacy: { user: safeUser },
    });
  } catch (error) {
    logger.error({ err: error, ...getRequestLogContext(req), action: 'get_profile' }, 'Error en getProfile');
    next(error);
  }
};
