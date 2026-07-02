import { type Request, type Response, type NextFunction } from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";

const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER = "x-csrf-token";
const CSRF_COOKIE = "csrf_token";
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

function generateToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

function timingSafeCompare(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (req.headers["authorization"]) {
    return next();
  }

  if (SAFE_METHODS.includes(req.method)) {
    const token = generateToken();
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || !timingSafeCompare(cookieToken, headerToken)) {
    res.status(403).json({
      error: { code: "CSRF_INVALID", message: "Invalid or missing CSRF token" },
    });
    return;
  }

  next();
}
