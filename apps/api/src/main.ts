import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createApp } from "./app";
import { getEnv } from "./config/env";
import { logger } from "./lib/logger";

const env = getEnv();
const app = createApp();

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
