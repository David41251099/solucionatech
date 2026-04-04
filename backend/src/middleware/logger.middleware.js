import crypto from "crypto";
import { logger } from "../config/logger.js";

export const requestContext = (req, res, next) => {
  req.requestId = crypto.randomUUID();
  req.context = {
    requestId: req.requestId,
    userId: req.user?.id ?? req.user?.userId ?? null,
  };

  next();
};

export const requestLogger = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  const requestId = req.context?.requestId ?? req.requestId ?? `http-${crypto.randomUUID()}`;

  res.on("finish", () => {
    const endedAt = process.hrtime.bigint();
    const durationMs = Number(endedAt - startedAt) / 1_000_000;

    logger.info(
      {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        duration: `${durationMs.toFixed(2)}ms`,
        requestId,
        userId: req.context?.userId ?? req.user?.userId ?? req.user?.id ?? null,
      },
      "HTTP request"
    );
  });

  next();
};
