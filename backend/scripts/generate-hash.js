/**
 * generate-hash.js
 * Script para generar hash bcrypt de contrasenas
 *
 * Uso:
 *   node scripts/generate-hash.js password123
 *   node scripts/generate-hash.js "mi contrasena segura"
 */

import bcrypt from 'bcrypt';
import { logger } from '../src/config/logger.js';

const SALT_ROUNDS = 10;

async function generateHash() {
  const password = process.argv[2];

  if (!password) {
    logger.error('Error: Debes proporcionar una contrasena');
    logger.info('\nUso:');
    logger.info('  node scripts/generate-hash.js password123');
    logger.info('  node scripts/generate-hash.js "mi contrasena segura"');
    process.exit(1);
  }

  try {
    logger.info('Generando hash bcrypt...');
    logger.info({ passwordLength: password.length }, 'Contrasena recibida');
    logger.info({ saltRounds: SALT_ROUNDS }, 'Salt rounds');

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    logger.info('Hash generado');
    logger.info({ hash }, 'Resultado');
    logger.info({ sqlValue: `'${hash}'` }, 'Para usar en SQL');
  } catch (error) {
    logger.error({ err: error }, 'Error al generar hash');
    process.exit(1);
  }
}

generateHash();
