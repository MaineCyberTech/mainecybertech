import { type Request, type Response, type NextFunction } from "express";
import * as Sentry from "@sentry/node";
import multer from "multer";
import { AppError, failure } from "../types";
import { logger } from "../lib/logger";
import { ZodError } from "zod";

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const requestId = req.id;

  // WH-P2-006: body-parser failures are client errors, not 500s. Oversized
  // bodies (per-provider webhook caps, global limit) must surface as 413 and
  // malformed JSON as 400 — previously both fell through to the generic 500.
  const bodyParserError = error as Error & { type?: string };
  if (bodyParserError.type === "entity.too.large") {
    logger.warn({ requestId, path: req.path }, "Request body too large");
    res.status(413).json(failure("PAYLOAD_TOO_LARGE", "Request body too large", 413));
    return;
  }
  if (bodyParserError.type === "entity.parse.failed") {
    logger.warn({ requestId, path: req.path }, "Malformed JSON body");
    res.status(400).json(failure("INVALID_JSON", "Malformed JSON body", 400));
    return;
  }

  // FILE-P3-006: multer upload limits are client errors, not 500s. Exceeding a
  // route's `limits.fileSize` previously fell through to the generic handler,
  // so an oversized upload returned 500 INTERNAL_SERVER_ERROR (and Sentry
  // noise) instead of the documented validation contract.
  if (error instanceof multer.MulterError) {
    const isSize = error.code === "LIMIT_FILE_SIZE";
    const status = isSize ? 413 : 400;
    const message = isSize
      ? "File is too large"
      : `Upload rejected: ${error.code.replace(/^LIMIT_/, "").toLowerCase().replace(/_/g, " ")}`;
    logger.warn({ requestId, path: req.path, code: error.code }, "Upload validation error");
    res.status(status).json(failure(isSize ? "PAYLOAD_TOO_LARGE" : "VALIDATION", message, status));
    return;
  }

  Sentry.captureException(error, {
    extra: { requestId, path: req.path, method: req.method },
    user: req.authUser ? { id: req.authUser.userId, email: req.authUser.email } : undefined,
  });

  if (error instanceof AppError) {
    logger.warn(
      {
        requestId,
        code: error.code,
        message: error.message,
        status: error.status,
        path: req.path,
        method: req.method,
      },
      "Application error",
    );
    // 5xx messages frequently carry raw Postgres/Supabase/Storage internals
    // (constraint names, column names, RLS hints). Log the real message above,
    // but return a generic client message for server-side failures.
    const clientMessage = error.status >= 500 ? "An unexpected error occurred" : error.message;
    res.status(error.status).json(failure(error.code, clientMessage, error.status, error.details));
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json(
      failure("VALIDATION", "Validation failed", 400, {
        issues: error.issues,
      }),
    );
    return;
  }

  logger.error({ requestId, err: error, path: req.path, method: req.method }, "Unexpected error");
  res.status(500).json(failure("INTERNAL_SERVER_ERROR", "An unexpected error occurred", 500));
}
