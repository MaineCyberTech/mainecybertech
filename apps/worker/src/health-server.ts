import * as http from "http";
import crypto from "crypto";
import { logger } from "./logger";
import { getRegisteredTaskTypes } from "./task-registry";
import { isShuttingDown } from "./shutdown";
import { getMetrics, getMetricsContentType } from "./metrics";
import { getWorkerQueueHealth, getWorkerQueueBackend } from "./queue-health";

export interface HealthServerOptions {
  /**
   * ARCH-P3-005: shared token for the worker /metrics endpoint, matching the
   * API's METRICS_TOKEN gate. When unset the endpoint fails closed (404) so an
   * unconfigured deployment never exposes metric labels on the compose
   * network. Prometheus sends it as `Authorization: Bearer <token>` (see
   * infra/digitalocean/prometheus.yml).
   *
   * NOTE: /health intentionally stays unauthenticated — the port is not
   * published to the host, and the container healthcheck plus the deploy
   * health gate probe it from inside the compose network. The deploy already
   * fails closed when METRICS_TOKEN is missing in production (deploy-do.yml),
   * so the metrics gate cannot silently disable itself.
   */
  metricsToken?: string;
}

/**
 * Fail-closed, constant-time bearer gate for /metrics. Mirrors the API's
 * `authorizeInternalRequest` (routes/health.ts): 404 rather than 401 so the
 * endpoint is not advertised, and `?token=` is accepted for manual debugging.
 */
export function authorizeMetricsRequest(
  req: http.IncomingMessage,
  token: string | undefined,
): boolean {
  if (!token) return false;
  const header = req.headers.authorization;
  let provided = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!provided) {
    try {
      provided = new URL(req.url ?? "/", "http://localhost").searchParams.get("token") ?? undefined;
    } catch {
      provided = undefined;
    }
  }
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function startHealthServer(
  port: number = 3001,
  options: HealthServerOptions = {},
): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      const queueHealth = getWorkerQueueHealth();
      const shuttingDown = isShuttingDown();
      // RES-P2-008: a lost queue connection is a real failure, not just a
      // "degraded" label — 503 makes the compose healthcheck and the deploy
      // gate act on it.
      const healthy = !shuttingDown && queueHealth.connected;

      res.statusCode = healthy ? 200 : 503;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          service: "worker",
          status: shuttingDown
            ? "draining"
            : queueHealth.connected
              ? "healthy"
              : "degraded",
          uptime: process.uptime(),
          registeredTasks: getRegisteredTaskTypes(),
          shuttingDown,
          // ARCH-P2-004: the consumer half of the queue backend contract; the
          // API exposes the producer half as portal_queue_backend_info.
          queueBackend: getWorkerQueueBackend(),
          queue: queueHealth,
        }),
      );
    } else if (req.url === "/metrics" || req.url?.startsWith("/metrics?")) {
      // ARCH-P3-005: parity with the API — an unauthenticated or untokened
      // request gets 404, never metric content.
      if (!authorizeMetricsRequest(req, options.metricsToken)) {
        res.statusCode = 404;
        res.end();
        return;
      }
      getMetrics()
        .then((data) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", getMetricsContentType());
          res.end(data);
        })
        .catch((err) => {
          logger.error({ err }, "Failed to generate metrics");
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Failed to generate metrics" }));
        });
    } else {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  server.listen(port, "0.0.0.0", () => {
    logger.info({ port }, "Health check server started");
  });
  server.unref();
  return server;
}
