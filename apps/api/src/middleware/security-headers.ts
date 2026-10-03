import { randomUUID } from "node:crypto";
import { type Request, type Response, type NextFunction } from "express";

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.removeHeader("X-Powered-By");

  const nonce = randomUUID();
  res.setHeader("X-Content-Security-Policy-Nonce", nonce);

  const isSwaggerUI = req.path.startsWith("/api/v1/docs");

  if (isSwaggerUI) {
    res.setHeader(
      "Content-Security-Policy",
      `default-src 'self'; script-src 'self' 'nonce-${nonce}' unpkg.com; style-src 'self' 'unsafe-inline' unpkg.com; img-src 'self' data: unpkg.com; font-src 'self' data:; connect-src 'self'`,
    );
  } else {
    res.setHeader(
      "Content-Security-Policy",
      `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'`,
    );
  }

  next();
}
