import promClient from "prom-client";
import { getRegisteredTaskTypes } from "./task-registry";
import { getTaskQueueStats } from "./producer";

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

  return register.metrics();
}