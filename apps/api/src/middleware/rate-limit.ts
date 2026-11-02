import crypto from "crypto";
import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { failure } from "../types";

/**
 * API-P3-001: every limiter returns the documented error envelope
 * (`{success:false,error:{code,message,status}}`) instead of
 * express-rate-limit's plain-text default. Without this the same 429 had a
 * JSON body on the global IP limiter and text on the auth/admin/search
 * limiters, so SDK clients could not branch on `error.code`.
 */
export function rateLimitHandler(message: string) {
  return (_req: Request, res: Response) => {
    res.status(429).json(failure("RATE_LIMITED", message, 429));
  };
}

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
  handler: rateLimitHandler("Too many requests from this user, please try again later."),
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

/**
 * Normalize an email for use in a rate-limit bucket key.
 *
 * SEC-P3-003: the raw string is case- and whitespace-sensitive, so
 * `User@Example.com`, `user@example.com` and ` user@example.com ` would
 * otherwise throttle in separate buckets and multiply the per-account ceiling.
 * The normalized address is hashed so the limiter never holds a plaintext
 * address as a key.
 */
export function emailRateLimitKey(email: unknown): string | undefined {
  if (typeof email !== "string") return undefined;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

/**
 * SEARCH-P2-007: dedicated limiter for the typeahead-driven search routes.
 *
 * Both global search endpoints are called by a 300 ms-debounced typeahead, so a
 * single session can emit many full-table searches per minute. The global
 * per-user budget (600/15 min) is far too coarse to bound that burst and the
 * endpoints are the most expensive read paths in the API. Cap the search
 * surface at 60 requests/minute per token (or IP when unauthenticated) — well
 * above human typing rates, low enough that a scripted client cannot turn the
 * typeahead into a query amplifier.
 */
export const rateLimitSearch = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  handler: rateLimitHandler("Too many search requests, please try again later."),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => userRateLimitKeyGenerator(req.headers.authorization, req.ip),
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});

/**
 * ADMIN-P2-005: dedicated limiter for expensive/destructive admin operations
 * (bulk invite, bulk document metadata/folder, organization onboarding and
 * deletion). These paths fan out to hundreds of rows/users or cascade tenant
 * data, so a compromised or careless admin token must not be able to hammer
 * them at script speed. Cap at 10/minute per token (or IP when unauthenticated)
 * — well above interactive admin use, low enough to bound abuse.
 */
export const rateLimitAdminOps = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  handler: rateLimitHandler("Too many admin operations, please try again later."),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => userRateLimitKeyGenerator(req.headers.authorization, req.ip),
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});

/**
 * FILE-P3-001: per-token limiter for the public document-share endpoint.
 *
 * The share token is a 32-byte capability, but a leaked token could be fetched
 * at the global per-IP rate (300/15 min) and burn `max_access` or hammer the
 * Storage signer. Key by sha256(token) — never the raw token — so one hot link
 * cannot exhaust a shared IP bucket, and cap it well above human use (30/min)
 * while staying far below the global budget.
 */
export function shareRateLimitKey(token: unknown): string {
  return crypto.createHash("sha256").update(String(token ?? "")).digest("hex").slice(0, 32);
}

export const rateLimitShare = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  handler: rateLimitHandler("Too many requests for this share link, please try again later."),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `share:${shareRateLimitKey(req.params.token)}`,
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});

/**
 * NOTIF-P3-005: limiter for the public unsubscribe endpoint. The token is
 * high-entropy and the write is idempotent, but an unauthenticated mutation
 * still needs an IP ceiling to bound scripted abuse.
 */
export const rateLimitUnsubscribe = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  handler: rateLimitHandler("Too many unsubscribe requests, please try again later."),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const token = (req.query as Record<string, unknown> | undefined)?.token;
    return `unsubscribe:${typeof token === "string" ? shareRateLimitKey(token) : `ip:${req.ip}`}`;
  },
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});

export const rateLimitAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: rateLimitHandler("Too many authentication attempts, please try again later."),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = emailRateLimitKey((req.body as Record<string, unknown> | undefined)?.email);
    return email ? `email:${email}` : `ip:${req.ip}`;
  },
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});

export const rateLimitEmail = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  handler: rateLimitHandler("Too many requests for this email, please try again later."),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = emailRateLimitKey((req.body as Record<string, unknown> | undefined)?.email);
    return email ? `email-action:${email}` : `ip:${req.ip}`;
  },
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});

/**
 * OBS-P3-006: Prometheus scrapes /metrics every 15s (4 requests/min from the
 * prometheus container's IP). The previous 5/min cap left almost no headroom:
 * one manual debug or retried request in the same minute 429'd the next scrape,
 * and repeated 429s can flap `up == 0` and false-fire MCTServiceDown. Allow
 * 12/min (3x the scrape rate) so a scrape plus ad-hoc debugging still succeeds.
 */
export const rateLimitMetrics = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  handler: rateLimitHandler("Too many requests to metrics endpoint"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `ip:${req.ip}`,
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});
