import rateLimit from "express-rate-limit";

export const rateLimitByUser = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests from this user, please try again later.",
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

export const rateLimitAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `ip:${req.ip}`,
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});
