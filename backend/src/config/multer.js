import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AppError from '../utils/AppError.js';
import { isAllowedUploadExtension } from '../middleware/uploadSecurity.js';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, '../../uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomUUID();
    cb(null, `${unique}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!isAllowedUploadExtension(file.originalname)) {
    logger.warn(
      {
        requestId: req?.context?.requestId ?? req?.requestId ?? null,
        userId: req?.context?.userId ?? req?.user?.userId ?? req?.user?.id ?? null,
        ticketId: req?.params?.id ?? null,
        action: 'invalid_upload_attempt',
        reason: 'invalid_extension',
        originalname: file?.originalname ?? null,
      },
      'Upload rechazado por extension no permitida'
    );
    return cb(new AppError('Tipo de archivo no permitido', 400));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

export default upload;
