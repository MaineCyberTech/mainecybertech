import { type Request, type Response, type NextFunction } from "express";
import {
  checkIdempotencyKey,
  storeIdempotencyKey,
} from "../lib/idempotency.js";
import { logger } from "../lib/logger.js";

export function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const key = req.headers["idempotency-key"];

  if (!key || typeof key !== "string") {
    return next();
  }

  if (key.length > 256) {
    return res.status(400).json({
      error: "Idempotency-Key header too long (max 256 chars)",
    });
  }

  checkIdempotencyKey(key)
    .then((existing) => {
      if (existing) {
        logger.info({ key, existing }, "Idempotency key hit");
        res.setHeader("Idempotency-Key", key);
        return res.status(409).json({
          error: "Idempotent request already processed",
          existingId: existing,
        });
      }

      const originalSend = res.send;
      res.send = function (body?: unknown): Response {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          storeIdempotencyKey(key, JSON.stringify(body)).catch((err) =>
            logger.error(
              { key, error: String(err) },
              "Failed to store idempotency key",
            ),
          );
        }
        return originalSend.call(this, body);
      };

      next();
    })
    .catch((err) => {
      logger.error({ key, error: String(err) }, "Idempotency check failed");
      next();
    });
}
