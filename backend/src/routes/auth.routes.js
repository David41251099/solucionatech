/**
 * auth.routes.js
 * Rutas de autenticacion
 *
 * Rutas:
 * POST /api/auth/register - Registro de usuario
 * POST /api/auth/login - Inicio de sesion
 * GET /api/auth/me - Obtener perfil (protegido)
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getProfile } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const isProd = process.env.NODE_ENV === 'production';
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 20 : 60,
  message: {
    success: false,
    data: null,
    message: 'Demasiadas solicitudes, intenta mas tarde.',
    error: 'Demasiadas solicitudes, intenta mas tarde.',
  },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

router.get('/me', verifyToken, getProfile);
router.get('/profile', verifyToken, getProfile);

export default router;
