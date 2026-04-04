/**
 * ticket.routes.js
 * Rutas de gestion de tickets
 * 
 * Rutas:
 * POST /api/tickets - Crear ticket (solo clientes)
 * GET /api/tickets - Listar tickets (filtrado por rol)
 * GET /api/tickets/:id - Ver detalle de ticket
 * PUT /api/tickets/:id - Actualizar ticket (solo tecnicos)
 * PATCH /api/tickets/:id/assign - Asignar tecnico (solo tecnicos)
 * PATCH /api/tickets/:id/status - Cambiar estado (solo tecnicos)
 * GET /api/tickets/:id/messages - Historial de mensajes del ticket
 * POST /api/tickets/:id/messages - Crear mensaje en ticket
 * PATCH /api/tickets/:id/cancel - Cancelar ticket (cliente)
 * PATCH /api/tickets/:id/release - Liberar ticket (técnico asignado)
 */

import express from 'express';
import {
  createTicket,
  getTickets,
  getAvailableTickets,
  getMyTickets,
  getTicketById,
  updateTicket,
  assignTicket,
  updateStatus,
  getTicketMessages,
  createTicketMessage,
  cancelTicket,
  releaseTicket
} from '../controllers/ticket.controller.js';
import { verifyToken, isClient, isTechnician } from '../middleware/auth.js';
import upload from '../config/multer.js';
import { validateUploadedImages } from '../middleware/uploadSecurity.js';
import { ensureTicketMessageAccessBeforeUpload } from '../middleware/ticketAccess.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Crear ticket (solo clientes)
router.post('/', isClient, upload.array('files', 5), validateUploadedImages, createTicket);

// Listar tickets (ambos roles, filtrado en controller)
router.get('/', getTickets);

// Tickets disponibles (solo tecnicos)
router.get('/available', isTechnician, getAvailableTickets);

// Mis tickets (solo tecnico autenticado)
router.get('/my-tickets', isTechnician, getMyTickets);

// Ver detalle de ticket
router.get('/:id', getTicketById);

// Historial de mensajes de ticket
router.get('/:id/messages', getTicketMessages);

// Crear mensaje en ticket
router.post(
  '/:id/messages',
  ensureTicketMessageAccessBeforeUpload,
  upload.single('file'),
  validateUploadedImages,
  createTicketMessage
);

// Actualizar ticket (solo tecnicos)
router.put('/:id', isTechnician, updateTicket);

// Asignar ticket (solo tecnicos)
router.patch('/:id/assign', isTechnician, assignTicket);

// Cambiar estado (solo tecnicos)
router.patch('/:id/status', isTechnician, updateStatus);

// Cancelar ticket (cliente)
router.patch('/:id/cancel', isClient, cancelTicket);

// Liberar ticket (tÃ©cnico asignado)
router.patch('/:id/release', isTechnician, releaseTicket);

export default router;
