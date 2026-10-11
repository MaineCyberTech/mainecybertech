import promClient from "prom-client";
import { getRegisteredTaskTypes } from "./task-registry";
import { getTaskQueueStats } from "./producer";
import { getWorkerQueueHealth } from "./queue-health";

const register = new promClient.Registry();

promClient.collectDefaultMetrics({ register });

export const taskExecutionsTotal = new promClient.Counter({
  name: "worker_task_executions_total",
  help: "Total number of task executions",
  labelNames: ["task_type", "status"] as const,
  registers: [register],
});

export const taskExecutionDuration = new promClient.Histogram({
  name: "worker_task_execution_duration_seconds",
  help: "Task execution duration in seconds",
  labelNames: ["task_type"] as const,
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [register],
});

export const taskQueueDepth = new promClient.Gauge({
  name: "worker_task_queue_depth",
  help: "Current number of tasks waiting or active in the BullMQ queue (set only when the queue connection is available)",
  labelNames: ["queue"] as const,
  registers: [register],
});

// RES-P2-008: 1 while the worker's BullMQ connections are ready, 0 when the
// producer Queue or the consumer Worker has lost its Redis connection.
export const workerQueueConnected = new promClient.Gauge({
  name: "worker_queue_connected",
  help: "1 when the worker's BullMQ queue connections (producer and consumer) are ready, or BullMQ is not the active queue backend; 0 when a connection is lost",
  registers: [register],
});

export const workerRegisteredTasks = new promClient.Gauge({
  name: "worker_registered_tasks",
  help: "Number of registered task handlers in the worker process",
  registers: [register],
});

export const workerMemoryUsage = new promClient.Gauge({
  name: "worker_memory_usage_bytes",
  help: "Worker process memory usage in bytes",
  labelNames: ["type"] as const,
  registers: [register],
});

export const notificationDeliveryTotal = new promClient.Counter({
  name: "worker_notification_delivery_total",
  help: "Total number of worker notification/email delivery attempts by channel and outcome",
  labelNames: ["channel", "status"] as const,
  registers: [register],
});

export const notificationSuppressedTotal = new promClient.Counter({
  name: "worker_notification_suppressed_total",
  help: "Total number of worker notifications suppressed because the recipient disabled the channel",
  labelNames: ["channel", "module"] as const,
  registers: [register],
});

export const webhookDeliveriesTotal = new promClient.Counter({
  name: "worker_webhook_deliveries_total",
  help: "Total outbound webhook delivery attempts by outcome",
  labelNames: ["status", "event"] as const,
  registers: [register],
});

export const webhookDeadLettersTotal = new promClient.Counter({
  name: "worker_webhook_dead_letters_total",
  help: "Total outbound webhook deliveries moved to the dead-letter set",
  labelNames: ["event"] as const,
  registers: [register],
});

export function recordWebhookDelivery(status: "success" | "failed", event: string): void {
  webhookDeliveriesTotal.inc({ status, event });
}

export function recordWebhookDeadLetter(event: string): void {
  webhookDeadLettersTotal.inc({ event });
}

/**
 * RES-P2-002: generic (non-webhook) tasks that exhausted their BullMQ
 * attempts and were written to `task_dead_letters`. Any increase means work
 * is stuck and unreplayable without operator action.
 */
export const taskDeadLettersTotal = new promClient.Counter({
  name: "worker_task_dead_letters_total",
  help: "Total generic worker tasks moved to the task dead-letter set after exhausting retries",
  labelNames: ["task_type"] as const,
  registers: [register],
});

export function recordTaskDeadLetter(taskType: string): void {
  taskDeadLettersTotal.inc({ task_type: taskType });
}

export function recordNotificationDelivery(
  channel: "in_app" | "email",
  status: "success" | "failed" | "skipped",
): void {
  notificationDeliveryTotal.inc({ channel, status });
}

export function recordNotificationSuppressed(channel: "in_app" | "email", module: string): void {
  notificationSuppressedTotal.inc({ channel, module });
}

export function updateMemoryMetrics(): void {
  const usage = process.memoryUsage();
  workerMemoryUsage.set({ type: "rss" }, usage.rss);
  workerMemoryUsage.set({ type: "heapTotal" }, usage.heapTotal);
  workerMemoryUsage.set({ type: "heapUsed" }, usage.heapUsed);
  workerMemoryUsage.set({ type: "external" }, usage.external);
}

export function getMetricsContentType(): string {
  return register.contentType;
}

export async function getMetrics(): Promise<string> {
  updateMemoryMetrics();
  workerRegisteredTasks.set(getRegisteredTaskTypes().length);

  const statsPromise = getTaskQueueStats().then((stats) => stats ?? null);
  const stats = await Promise.race([
    statsPromise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
  ]);
  if (stats) {
    taskQueueDepth.set({ queue: "mct-tasks" }, stats.waiting + stats.active);
  } else {
    taskQueueDepth.set({ queue: "unavailable" }, 0);
  }

  // RES-P2-008: scrape-time connectivity read (producer's cached state plus
  // the consumer's connection lifecycle state).
  workerQueueConnected.set(getWorkerQueueHealth().connected ? 1 : 0);

  return register.metrics();
}

/**
 * Stripe reconciliation drift (BILL-P2-003).
 *
 * The nightly `stripe-reconcile` task compares the local billing mirror with
 * Stripe (the source of truth) and increments this counter for every mismatch
 * it finds: a subscription status that disagrees, or an invoice/payment
 * count/sum that does not line up. Any drift means the local copy - and the
 * entitlements/billing views derived from it - is stale, so
 * infra/digitalocean/prometheus.rules.yml alerts on new drift.
 */
export const stripeReconcileDriftTotal = new promClient.Counter({
  name: "worker_stripe_reconcile_drift_total",
  help: "Stripe reconciliation drift findings by kind",
  labelNames: ["kind"] as const,
  registers: [register],
});

export type StripeReconcileDriftKind =
  | "subscription_status"
  | "invoice_count"
  | "invoice_sum"
  | "payment_count"
  | "payment_sum";

export function recordStripeReconcileDrift(kind: StripeReconcileDriftKind): void {
  stripeReconcileDriftTotal.inc({ kind });
}