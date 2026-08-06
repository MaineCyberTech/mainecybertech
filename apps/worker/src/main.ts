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

  // Schedule automation-run-check (scheduled workflows) to run hourly
  const AUTOMATION_INTERVAL_MS = 60 * 60 * 1000;
  const automationInterval = setInterval(() => {
    logger.info("Running scheduled automation-run-check");
    runScheduledTask("automation-run-check").catch((error) => {
      logger.error({ error }, "Scheduled automation-run-check failed");
    });
  }, AUTOMATION_INTERVAL_MS);
  automationInterval.unref();

  // Schedule approval-overdue-check to run hourly
  const APPROVAL_INTERVAL_MS = 60 * 60 * 1000;
  const approvalInterval = setInterval(() => {
    logger.info("Running scheduled approval-overdue-check");
    runScheduledTask("approval-overdue-check").catch((error) => {
      logger.error({ error }, "Scheduled approval-overdue-check failed");
    });
  }, APPROVAL_INTERVAL_MS);
  approvalInterval.unref();

  // Schedule the module scan tasks. Each runs on a staggered offset so the
  // scans don't all fire on the same tick.
  const SCAN_INTERVAL_MS = 60 * 60 * 1000; // hourly
  const SCAN_INTERVAL_6H_MS = 6 * 60 * 60 * 1000; // every 6 hours
  const SCAN_INTERVAL_DAILY_MS = 24 * 60 * 60 * 1000; // daily
  const scheduledScans: Array<{ name: string; intervalMs: number; offsetMin: number }> = [
    { name: "domain-monitor-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 3 },
    { name: "website-monitor-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 8 },
    { name: "vendor-contract-renewal-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 13 },
    { name: "patch-compliance-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 18 },
    { name: "license-optimizer-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 23 },
    { name: "backup-dr-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 28 },
    { name: "phishing-campaign-send", intervalMs: SCAN_INTERVAL_MS, offsetMin: 33 },
    { name: "status-maintenance-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 38 },
    { name: "dmarc-coach-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 43 },
    { name: "m365-hardening-scan", intervalMs: SCAN_INTERVAL_6H_MS, offsetMin: 48 },
    { name: "endpoint-security-check", intervalMs: SCAN_INTERVAL_6H_MS, offsetMin: 53 },
    { name: "saas-audit-scan", intervalMs: SCAN_INTERVAL_6H_MS, offsetMin: 58 },
    { name: "qbr-scheduled-generate", intervalMs: SCAN_INTERVAL_DAILY_MS, offsetMin: 63 },
    { name: "retention", intervalMs: SCAN_INTERVAL_DAILY_MS, offsetMin: 70 },
    { name: "orphan-cleanup", intervalMs: SCAN_INTERVAL_6H_MS, offsetMin: 76 },
  ];
  for (const scan of scheduledScans) {
    const interval = setInterval(() => {
      logger.info(`Running scheduled ${scan.name}`);
      runScheduledTask(scan.name).catch((error) => {
        logger.error({ error }, `Scheduled ${scan.name} failed`);
      });
    }, scan.intervalMs);
    interval.unref();
  }
  if (scheduledScans.length > 0) {
    const first = scheduledScans[0];
    const initialDelayMs = first.offsetMin * 60 * 1000;
    const initial = setTimeout(() => {
      logger.info(`Running initial ${first.name}`);
      runScheduledTask(first.name).catch((error) => {
        logger.error({ error }, `Initial ${first.name} failed`);
      });
    }, initialDelayMs);
    initial.unref();
  }

  runWorkerTasks().catch((error) => {
    logger.error(error, "Worker crashed");
    Sentry.captureException(error, { extra: { phase: "main-loop" } });
    process.exit(1);
  });
}
