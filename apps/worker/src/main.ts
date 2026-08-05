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
import { enqueueTask } from "./producer";
import { markShuttingDown } from "./shutdown";
registerAllTasks();

// ============= Uncaught Error Handling =============
process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "Uncaught exception — shutting down");
  Sentry.captureException(error, { extra: { phase: "uncaught-exception" } });
  markShuttingDown();
  process.exit(1);
});

// ============= Scheduled Tasks =============
async function runScheduledTask(type: string, payload: Record<string, unknown> = {}) {
  const enqueued = await enqueueTask(type, payload);
  if (!enqueued) {
    logger.info({ type }, "Queue unavailable — running scheduled task directly");
    await executeTask({ type, payload });
  }
}

// ============= Main =============
if (process.env.JEST_WORKER_ID === undefined && process.env.NODE_ENV !== "test") {
  startHealthServer(env.HEALTH_PORT);

  // Schedule stripe-reconcile to run daily
  const RECONCILE_INTERVAL_MS = 24 * 60 * 60 * 1000;
  const reconcileInterval = setInterval(() => {
    logger.info("Running scheduled stripe-reconcile");
    runScheduledTask("stripe-reconcile").catch((error) => {
      logger.error({ error }, "Scheduled stripe-reconcile failed");
    });
  }, RECONCILE_INTERVAL_MS);
  reconcileInterval.unref();

  // Schedule public-interaction-retention (90-day PII purge) to run daily
  const PUBLIC_INTERACTION_RETENTION_INTERVAL_MS = 24 * 60 * 60 * 1000;
  const publicInteractionRetentionInterval = setInterval(() => {
    logger.info("Running scheduled public-interaction-retention");
    runScheduledTask("public-interaction-retention").catch((error) => {
      logger.error({ error }, "Scheduled public-interaction-retention failed");
    });
  }, PUBLIC_INTERACTION_RETENTION_INTERVAL_MS);
  publicInteractionRetentionInterval.unref();

  // Schedule webhook-retry (with DLQ) to run every 5 minutes
  const WEBHOOK_RETRY_INTERVAL_MS = 5 * 60 * 1000;
  const webhookRetryInterval = setInterval(() => {
    logger.info("Running scheduled webhook-retry");
    runScheduledTask("webhook-retry").catch((error) => {
      logger.error({ error }, "Scheduled webhook-retry failed");
    });
  }, WEBHOOK_RETRY_INTERVAL_MS);
  webhookRetryInterval.unref();

  // Schedule sla-log-check (SLA breach evaluation from tickets) to run hourly
  const SLA_CHECK_INTERVAL_MS = 60 * 60 * 1000;
  const slaCheckInterval = setInterval(() => {
    logger.info("Running scheduled sla-log-check");
    runScheduledTask("sla-log-check").catch((error) => {
      logger.error({ error }, "Scheduled sla-log-check failed");
    });
  }, SLA_CHECK_INTERVAL_MS);
  slaCheckInterval.unref();

  // Schedule business-os-snapshot (MSP dashboard aggregates) to run daily
  const BUSINESS_OS_INTERVAL_MS = 24 * 60 * 60 * 1000;
  const businessOsInterval = setInterval(() => {
    logger.info("Running scheduled business-os-snapshot");
    runScheduledTask("business-os-snapshot").catch((error) => {
      logger.error({ error }, "Scheduled business-os-snapshot failed");
    });
  }, BUSINESS_OS_INTERVAL_MS);
  businessOsInterval.unref();

  runWorkerTasks().catch((error) => {
    logger.error(error, "Worker crashed");
    Sentry.captureException(error, { extra: { phase: "main-loop" } });
    process.exit(1);
  });
}
