import { type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "crypto";
import { logger as rootLogger } from "../lib/logger";
import { httpRequestsTotal, httpRequestDuration } from "../lib/metrics";

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

/**
 * OBS-P2-010 / PERF-P2-001: Prometheus labels must be bounded, so HTTP metrics
 * are labelled with the matched Express route template rather than the concrete
 * request path. A raw path such as `/api/v1/tickets/4f2c...` mints a new series
 * per resource id, which grows the TSDB without bound. The router sets
 * `req.route` when a route matches (before `res.on("finish")` fires) and
 * `req.baseUrl` carries the mount prefix, so together they reconstruct the
 * template (`/api/v1/tickets/:id`). Requests that never matched a route (404s,
 * middleware-only paths such as `/metrics`) collapse into one bounded bucket.
 */
export function routeLabel(req: Request): string {
  const matched = (req as Request & { route?: { path?: unknown } }).route;
  const routePath = matched?.path;
  if (typeof routePath === "string" && routePath.length > 0) {
    const base = req.baseUrl || "";
    // A mounted router's root route (`/`) is fully described by its mount path.
    const suffix = routePath === "/" ? "" : routePath;
    return `${base}${suffix}` || "/";
  }
  return "unmatched";
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

    const route = routeLabel(req);
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: String(res.statusCode),
    });
    httpRequestDuration.observe(
      { method: req.method, route, status_code: String(res.statusCode) },
      duration / 1000,
    );
  });

  next();
}
