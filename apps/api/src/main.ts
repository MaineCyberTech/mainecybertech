import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createApp } from "./app";
import { getEnv } from "./config/env";
import { logger } from "./lib/logger";
import { checkRedisHealth } from "./lib/health";
import { initializeCache, shutdownCache } from "./middleware/cache";

const env = getEnv();
const app = createApp();

if (env.NODE_ENV === "production") {
  const missing = [];
  if (!env.SMTP_HOST) missing.push("SMTP_HOST");
  if (!env.SMTP_PORT) missing.push("SMTP_PORT");
  if (!env.SMTP_USER) missing.push("SMTP_USER");
  if (!env.SMTP_PASS) missing.push("SMTP_PASS");
  if (missing.length > 0) {
    logger.warn({ missing }, "SMTP not fully configured — email notifications will fail silently");
  }
}

const server = app.listen(env.API_PORT, () => {
  logger.info(`API listening on http://localhost:${env.API_PORT}`);
});

// Initial Redis health probe (non-fatal — logs the result for observability).
if (env.REDIS_URL) {
  checkRedisHealth(env)
    .then((result) => {
      if (result.status === "healthy") {
        logger.info({ latencyMs: result.latencyMs }, "Redis health check passed");
      } else {
        logger.warn({ error: result.error }, "Redis health check failed");
      }
    })
    .catch((err) => {
      logger.warn({ err }, "Redis health check errored");
    });
}

// Initialize the response cache (Redis-backed with in-memory fallback).
// Cache failures are non-fatal — the app must keep serving without it.
initializeCache()
  .then(() => logger.info("Response cache initialized"))
  .catch((err) => {
    logger.warn({ err }, "Failed to initialize response cache — continuing without cache");
  });

// Graceful shutdown: drain in-flight requests on SIGTERM/SIGINT
function shutdown(signal: string) {
  logger.info({ signal }, "Received shutdown signal — draining connections...");
  shutdownCache();
  server.close(() => {
    logger.info("All connections closed — shutting down");
    process.exit(0);
  });

  // Force exit after 10s if connections don't drain
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Log-and-continue for non-fatal async rejections. Background promises
// (queue producers, webhook dispatchers, cache init) can reject without the
// server being unusable — exiting on every unhandled rejection makes the
// container restart-loop. Only true fatal states (uncaughtException) exit.
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection — continuing");
});

process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "Uncaught exception — shutting down");
  process.exit(1);
});
