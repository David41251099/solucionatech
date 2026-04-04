import crypto from 'crypto';
import { logger } from '../config/logger.js';

const errorHandler = (err, req, res, next) => {
  const requestId = req.context?.requestId ?? req.requestId ?? `http-${crypto.randomUUID()}`;
  logger.error(
    {
      message: err.message,
      stack: err.stack,
      status: err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500),
      path: req.originalUrl || req.url,
      method: req.method,
      requestId,
      userId: req.context?.userId ?? req.user?.userId ?? req.user?.id ?? null,
      ticketId: req.params?.id ?? null,
    },
    'Unhandled error'
  );

  const statusCode = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  const message = err.message || 'Internal Server Error';

  const response = {
    success: false,
    data: null,
    message,
    error: message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
