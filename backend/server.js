/**
 * server.js
 * Punto de entrada principal del servidor
 * - Carga variables de entorno
 * - Inicia el servidor Express
 * - Inicializa Socket.IO
 * - Maneja errores de inicio
 */

import dotenv from 'dotenv';
import http from 'http';
import app from './src/app.js';
import { initSocket } from './src/socket/index.js';
import { logger } from './src/config/logger.js';

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT || 5000;

// Crear servidor HTTP
const server = http.createServer(app);

// Inicializar Socket.IO
initSocket(server);

// Iniciar servidor
server.listen(PORT, () => {
  logger.info({ port: PORT }, 'Servidor iniciado');
  logger.info({ environment: process.env.NODE_ENV || 'development' }, 'Entorno backend');
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Error no manejado (unhandledRejection)');
  process.exit(1);
});
