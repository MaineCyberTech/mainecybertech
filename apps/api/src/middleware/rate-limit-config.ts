import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
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

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      return `user:${auth.slice(7, 27)}`;
    }
    return `ip:${req.ip}`;
  },
  skip: (req) =>
    req.path === "/health" ||
    req.path === "/api/v1/docs" ||
    req.path === "/api/v1/openapi.json" ||
    req.ip === "127.0.0.1" ||
    req.ip === "::1",
});

export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `ip:${req.ip}`,
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});

export const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many webhook requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const signature = req.headers["x-webhook-signature"];
    return signature ? `webhook:${(signature as string).slice(0, 16)}` : `ip:${req.ip}`;
  },
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});

export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many admin requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      return `admin:${auth.slice(7, 27)}`;
    }
    return `ip:${req.ip}`;
  },
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});
