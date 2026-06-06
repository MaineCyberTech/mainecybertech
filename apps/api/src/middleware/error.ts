import { type Request, type Response, type NextFunction } from "express";
import * as Sentry from "@sentry/node";
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

  Sentry.captureException(error, {
    extra: { requestId, path: req.path, method: req.method },
    user: req.authUser ? { id: req.authUser.userId, email: req.authUser.email } : undefined,
  });

  if (error instanceof AppError) {
    logger.warn(
      { requestId, code: error.code, message: error.message, status: error.status, path: req.path, method: req.method },
      "Application error",
    );
    res
      .status(error.status)
      .json(failure(error.code, error.message, error.status, error.details));
    return;
  }

  if (error instanceof ZodError) {
    res
      .status(400)
      .json(
        failure("VALIDATION", "Validation failed", 400, {
          issues: error.issues,
        }),
      );
    return;
  }

  logger.error({ requestId, err: error, path: req.path, method: req.method }, "Unexpected error");
  res
    .status(500)
    .json(
      failure("INTERNAL_SERVER_ERROR", "An unexpected error occurred", 500),
    );
}
