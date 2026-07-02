import { type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "crypto";
import { logger as rootLogger } from "../lib/logger";

declare global {
  namespace Express {
    interface Request {
      id: string;
      log: typeof rootLogger;
    }
  }
}

export function requestId(req: Request, _res: Response, next: NextFunction) {
  req.id = (req.headers["x-request-id"] as string) || randomUUID();
  req.log = rootLogger.child({ requestId: req.id });
  _res.setHeader("X-Request-ID", req.id);
  next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    req.log[level](
      {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      },
      "Request completed",
    );
  });

  next();
}
