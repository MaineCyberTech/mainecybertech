import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../types";

declare global {
  namespace Express {
    interface Request {
      ifMatchVersion?: number;
    }
  }
}

export function requireIfMatch(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const ifMatch = req.headers["if-match"];

  if (!ifMatch) {
    return next();
  }

  if (Array.isArray(ifMatch)) {
    throw new AppError(
      "PRECONDITION_FAILED",
      "Multiple If-Match headers not supported",
      412,
    );
  }

  const version = parseInt(ifMatch, 10);
  if (isNaN(version)) {
    throw new AppError(
      "PRECONDITION_FAILED",
      "If-Match header must be a valid integer",
      412,
    );
  }

  req.ifMatchVersion = version;
  next();
}

export function checkVersionMatch(
  currentVersion: number,
  ifMatchVersion?: number,
): void {
  if (ifMatchVersion !== undefined && currentVersion !== ifMatchVersion) {
    throw new AppError(
      "VERSION_CONFLICT",
      `Resource version mismatch. Current version: ${currentVersion}, provided: ${ifMatchVersion}`,
      409,
    );
  }
}
