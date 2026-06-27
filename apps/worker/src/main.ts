import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import * as Sentry from "@sentry/node";
import pino from "pino";
import { logger } from "./logger";
import { env } from "./env";
import { runWorkerTasks } from "./consumer-sqs";
import { startHealthServer } from "./health-server";

// ============= Sentry =============
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 0.0,
  });
  logger.info("Sentry initialized");
}

// ============= Register Integration Tasks =============
import { registerAllTasks } from "./tasks";
registerAllTasks();

// ============= Main =============
if (
  process.env.JEST_WORKER_ID === undefined &&
  process.env.NODE_ENV !== "test"
) {
  startHealthServer(env.HEALTH_PORT);
  runWorkerTasks().catch((error) => {
    logger.error(error, "Worker crashed");
    Sentry.captureException(error, { extra: { phase: "main-loop" } });
    process.exit(1);
  });
}