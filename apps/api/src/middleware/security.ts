import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../types";

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
  if (typeof value !== "string") return false;
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(value));
}

function containsSqlInjection(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = value
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string"
          ? item.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;")
          : item,
      );
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function inputSanitizer(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    for (const [key, value] of Object.entries(req.body)) {
      if (containsDangerousContent(value)) {
        logger.warn({ key, ip: req.ip, path: req.path }, "Blocked XSS attempt");
        throw new AppError("VALIDATION", "Input contains potentially dangerous content", 400);
      }
      if (containsSqlInjection(value)) {
        logger.warn({ key, ip: req.ip, path: req.path }, "Blocked SQL injection attempt");
        throw new AppError("VALIDATION", "Input contains invalid characters", 400);
      }
    }

    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === "object") {
    for (const [key, value] of Object.entries(req.query)) {
      if (containsDangerousContent(value)) {
        logger.warn({ key, ip: req.ip, path: req.path }, "Blocked XSS in query params");
        throw new AppError("VALIDATION", "Query parameter contains potentially dangerous content", 400);
      }
    }
  }

  next();
}

import pino from "pino";
const logger = pino({ level: process.env.LOG_LEVEL || "info" });
