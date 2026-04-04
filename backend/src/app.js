/**
 * app.js
 * Configuracion principal de Express
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import authRoutes from './routes/auth.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import errorHandler from './middleware/errorHandler.js';
import { requestContext, requestLogger } from './middleware/logger.middleware.js';
import AppError from './utils/AppError.js';
import { sendSuccess } from './utils/httpResponses.js';

const app = express();

const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || (!isProd && /^http:\/\/localhost:\d+$/.test(origin))) {
      callback(null, true);
      return;
    }

    callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 300,
  message: {
    success: false,
    data: null,
    message: 'Demasiadas solicitudes, intenta mas tarde.',
    error: 'Demasiadas solicitudes, intenta mas tarde.',
  },
});

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestContext);
app.use(requestLogger);

app.use(
  '/uploads',
  express.static(path.resolve('uploads'), {
    index: false,
    redirect: false,
    dotfiles: 'ignore',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/health', (req, res) => {
  return sendSuccess(res, {
    data: { status: 'ok' },
    message: 'SolucionaTech API funcionando',
  });
});

app.use((req, res, next) => {
  next(new AppError('Ruta no encontrada', 404));
});

app.use(errorHandler);

export default app;
// test CI
// test backend only
