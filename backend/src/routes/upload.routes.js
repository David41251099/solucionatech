import express from 'express';
import upload from '../config/multer.js';
import AppError from '../utils/AppError.js';
import { verifyToken } from '../middleware/auth.js';
import { sendSuccess } from '../utils/httpResponses.js';
import { validateUploadedImages } from '../middleware/uploadSecurity.js';

const router = express.Router();

router.post('/', verifyToken, upload.single('file'), validateUploadedImages, (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Archivo requerido', 400));
  }

  const url = `/uploads/${req.file.filename}`;

  return sendSuccess(res, {
    status: 201,
    message: 'Archivo subido exitosamente',
    data: { url },
    legacy: { url },
  });
});

export default router;
