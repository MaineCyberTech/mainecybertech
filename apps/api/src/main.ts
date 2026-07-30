import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createApp } from "./app";
import { getEnv } from "./config/env";
import { logger } from "./lib/logger";

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

// Graceful shutdown: drain in-flight requests on SIGTERM/SIGINT
function shutdown(signal: string) {
  logger.info({ signal }, "Received shutdown signal — draining connections...");
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

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection — shutting down");
  process.exit(1);
});
