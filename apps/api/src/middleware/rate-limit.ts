import crypto from "crypto";
import rateLimit from "express-rate-limit";

/**
 * Derives a rate-limit key from a Bearer token.
 *
 * The token is **not verified** here (auth middleware runs later), so its
 * claims cannot be trusted — decoding `sub` let a caller rotate forged values
 * for unlimited buckets. Key by a SHA-256 hash of the whole token instead
 * (stable for the token's lifetime), and treat the global IP limiter as the
 * authoritative ceiling. Falls back to the client IP when there is no token.
 */
export function userRateLimitKeyGenerator(
  authorization: string | string[] | undefined,
  ip: string | undefined,
): string {
  const clientIp = ip ?? "unknown";
  const header = Array.isArray(authorization) ? authorization[0] : authorization;
  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7);
    if (!token) return `ip:${clientIp}`;
    return `user:${crypto.createHash("sha256").update(token).digest("hex").slice(0, 32)}`;
  }
  return `ip:${clientIp}`;
}

export const rateLimitByUser = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: "Too many requests from this user, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => userRateLimitKeyGenerator(req.headers.authorization, req.ip),
  skip: (req) =>
    req.path === "/health" ||
    req.path === "/api/v1/docs" ||
    req.path === "/api/v1/openapi.json" ||
    req.ip === "127.0.0.1" ||
    req.ip === "::1",
});

export const rateLimitAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body as Record<string, unknown> | undefined)?.email;
    return email ? `email:${email}` : `ip:${req.ip}`;
  },
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});

export const rateLimitEmail = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many requests for this email, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body as Record<string, unknown> | undefined)?.email as string | undefined;
    return email ? `email-action:${email.toLowerCase()}` : `ip:${req.ip}`;
  },
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});

export const rateLimitMetrics = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many requests to metrics endpoint",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `ip:${req.ip}`,
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});
