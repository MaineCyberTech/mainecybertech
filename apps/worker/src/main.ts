import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import * as Sentry from "@sentry/node";
import { logger } from "./logger";
import { env } from "./env";
import { runWorkerTasks } from "./consumer-sqs";
import { startHealthServer } from "./health-server";
import { executeTask } from "./task-registry";

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
if (process.env.JEST_WORKER_ID === undefined && process.env.NODE_ENV !== "test") {
  startHealthServer(env.HEALTH_PORT);

  // Schedule stripe-reconcile to run daily
  const RECONCILE_INTERVAL_MS = 24 * 60 * 60 * 1000;
  const reconcileInterval = setInterval(async () => {
    logger.info("Running scheduled stripe-reconcile");
    await executeTask({ type: "stripe-reconcile", payload: {} });
  }, RECONCILE_INTERVAL_MS);
  reconcileInterval.unref();

  runWorkerTasks().catch((error) => {
    logger.error(error, "Worker crashed");
    Sentry.captureException(error, { extra: { phase: "main-loop" } });
    process.exit(1);
  });
}
