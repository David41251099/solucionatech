/**
 * db.js
 * Configuracion de conexion a PostgreSQL
 * - Pool de conexiones
 * - Configuracion desde variables de entorno
 * - Funciones helper para queries
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { logger } from './logger.js';

dotenv.config();

const { Pool } = pg;

// Validar variables de entorno requeridas
if (!process.env.DB_PASSWORD) {
  throw new Error('DB_PASSWORD no esta definida en el .env');
}

// Configurar pool de conexiones
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'solucionatech',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Verificar conexion
pool.on('connect', () => {
  logger.info('Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  logger.error({ err }, 'Error en PostgreSQL');
});

// Helper para queries
export const query = (text, params) => pool.query(text, params);

export default pool;
