import { type Request, type Response, type NextFunction } from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { getEnv } from "../config/env";

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

/**
 * The app frontend (app.*) and API (api.*) are separate subdomains. A host-only
 * cookie set on the API origin is invisible to `document.cookie` on the app
 * origin, so the SDK can never read the csrf token and every cross-origin
 * mutation 403s. Double-submit needs the cookie readable on BOTH subdomains:
 * set the Domain to the registrable parent (e.g. .mainecybertech.com). On
 * localhost / bare IPs no Domain attribute is added (host-only, same-origin).
 */
function cookieDomain(req: Request): string | undefined {
  const host = req.get("host");
  if (!host) return undefined;
  const hostname = host.split(":")[0].toLowerCase();
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
  ) {
    return undefined;
  }
  const labels = hostname.split(".");
  if (labels.length < 3) return undefined;
  return `.${labels.slice(-2).join(".")}`;
}

const CSRF_SKIP_PATHS = [
  "/api/v1/auth/sign-in",
  "/api/v1/auth/sign-up",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
  "/api/v1/auth/callback",
];

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (req.headers["authorization"]) {
    return next();
  }

  // Auth endpoints are rate-limited and don't need CSRF
  if (CSRF_SKIP_PATHS.includes(req.path)) {
    return next();
  }

  // Public contact form is explicitly open
  if (req.path.startsWith("/api/v1/public/")) {
    return next();
  }

  // Webhook endpoints use signature verification
  if (req.path.startsWith("/api/v1/webhooks/")) {
    return next();
  }

  if (SAFE_METHODS.includes(req.method)) {
    const token = generateToken();
    const domain = cookieDomain(req);
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: getEnv().NODE_ENV === "production",
      sameSite: "lax",
      ...(domain ? { domain } : {}),
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
