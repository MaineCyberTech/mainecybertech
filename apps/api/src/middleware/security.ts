import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../types";
import { logger } from "../lib/logger";

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:text\/html/i,
  /vbscript:/i,
  /expression\s*\(/i,
  /url\s*\(/i,
  /<!--/,
  /-->/,
];

const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|alter|create|exec|execute|xp_|sp_|0x)\b)/i,
  /(--|;|\/\*|\*\/|@@|char|nchar|varchar|nvarchar|alter|begin|cast|create|cursor|declare|exec|execute|fetch|kill|sys|sysobjects|syscolumns)/i,
  /('(\s|%20)*(or|and)(\s|%20)')/i,
];

function containsDangerousContent(value: unknown): boolean {
  if (typeof value === "string") {
    return DANGEROUS_PATTERNS.some((pattern) => pattern.test(value));
  }
  if (Array.isArray(value)) {
    return value.some((v) => containsDangerousContent(v));
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((v) => containsDangerousContent(v));
  }
  return false;
}

function containsSqlInjection(value: unknown): boolean {
  if (typeof value === "string") {
    return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
  }
  if (Array.isArray(value)) {
    return value.some((v) => containsSqlInjection(v));
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((v) => containsSqlInjection(v));
  }
  return false;
}

function traverseAndCheck(
  obj: Record<string, unknown>,
  ip: string | undefined,
  path: string,
): string | null {
  for (const [key, value] of Object.entries(obj)) {
    if (containsDangerousContent(value)) {
      logger.warn({ key, ip, path }, "Blocked XSS attempt");
      return "Input contains potentially dangerous content";
    }
    if (containsSqlInjection(value)) {
      logger.warn({ key, ip, path }, "Blocked SQL injection attempt");
      return "Input contains invalid characters";
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = traverseAndCheck(value as Record<string, unknown>, ip, path);
      if (nested) return nested;
    }
  }
  return null;
}

export function inputSanitizer(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    const bodyError = traverseAndCheck(req.body as Record<string, unknown>, req.ip, req.path);
    if (bodyError) {
      throw new AppError("VALIDATION", bodyError, 400);
    }
  }

  if (req.query && typeof req.query === "object") {
    for (const [key, value] of Object.entries(req.query)) {
      if (containsDangerousContent(value)) {
        logger.warn({ key, ip: req.ip, path: req.path }, "Blocked XSS in query params");
        throw new AppError(
          "VALIDATION",
          "Query parameter contains potentially dangerous content",
          400,
        );
      }
    }
  }

  next();
}
