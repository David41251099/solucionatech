import fs from 'fs';
import path from 'path';
import AppError from '../utils/AppError.js';
import { logger } from '../config/logger.js';

const MAX_HEADER_BYTES = 12;
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const extensionToMimeType = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const dangerousExtensions = new Set([
  '.exe',
  '.js',
  '.mjs',
  '.cjs',
  '.bat',
  '.cmd',
  '.sh',
  '.ps1',
  '.msi',
  '.dll',
  '.com',
  '.scr',
]);

const getFilesFromRequest = (req) => {
  if (Array.isArray(req.files)) return req.files;
  if (req.file) return [req.file];
  return [];
};

const normalizeOriginalName = (originalname = '') => String(originalname).trim().toLowerCase();

const hasBlockedDoubleExtension = (originalname) => {
  const normalized = normalizeOriginalName(originalname);
  const parts = normalized.split('.').filter(Boolean);
  if (parts.length < 3) {
    return false;
  }

  const penultimateExt = `.${parts[parts.length - 2]}`;
  const finalExt = `.${parts[parts.length - 1]}`;

  if (dangerousExtensions.has(penultimateExt)) {
    return true;
  }

  // Bloquea payloads tipo "imagen.jpg.exe".
  return allowedExtensions.has(penultimateExt) && !allowedExtensions.has(finalExt);
};

const readHeader = async (filePath) => {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(MAX_HEADER_BYTES);
    const { bytesRead } = await handle.read(buffer, 0, MAX_HEADER_BYTES, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
};

const detectMimeFromMagicBytes = (header) => {
  if (
    header.length >= 3 &&
    header[0] === 0xff &&
    header[1] === 0xd8 &&
    header[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  if (
    header.length >= 8 &&
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47 &&
    header[4] === 0x0d &&
    header[5] === 0x0a &&
    header[6] === 0x1a &&
    header[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (
    header.length >= 12 &&
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
};

const safeUnlink = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // Ignorar error de limpieza para no ocultar el error principal.
  }
};

const getUploadLogContext = (req, file = null, extra = {}) => ({
  requestId: req?.context?.requestId ?? req?.requestId ?? null,
  userId: req?.context?.userId ?? req?.user?.userId ?? req?.user?.id ?? null,
  ticketId: req?.params?.id ?? null,
  filename: file?.filename ?? null,
  originalname: file?.originalname ?? null,
  mimetype: file?.mimetype ?? null,
  ...extra,
});

export const validateUploadedImages = async (req, res, next) => {
  const files = getFilesFromRequest(req);
  if (files.length === 0) {
    return next();
  }

  try {
    for (const file of files) {
      const originalName = normalizeOriginalName(file.originalname);
      const extension = path.extname(originalName);
      const expectedMimeType = extensionToMimeType[extension];

      if (!allowedExtensions.has(extension) || !expectedMimeType) {
        throw new AppError('Tipo de archivo no permitido', 400);
      }

      if (hasBlockedDoubleExtension(originalName)) {
        throw new AppError('Nombre de archivo no permitido', 400);
      }

      const header = await readHeader(file.path);
      const detectedMimeType = detectMimeFromMagicBytes(header);

      if (!detectedMimeType || detectedMimeType !== expectedMimeType) {
        throw new AppError('Contenido de archivo no permitido', 400);
      }
    }

    return next();
  } catch (error) {
    logger.warn(
      {
        ...getUploadLogContext(req, files[0] ?? null, {
          action: 'invalid_upload_attempt',
          reason: error?.message ?? 'invalid_file',
          filesCount: files.length,
        }),
      },
      'Intento de upload inválido'
    );
    await Promise.all(files.map((file) => safeUnlink(file.path)));
    return next(error);
  }
};

export const isAllowedUploadExtension = (originalname) => {
  const normalized = normalizeOriginalName(originalname);
  const extension = path.extname(normalized);

  if (!allowedExtensions.has(extension)) {
    return false;
  }

  if (hasBlockedDoubleExtension(normalized)) {
    return false;
  }

  return true;
};
