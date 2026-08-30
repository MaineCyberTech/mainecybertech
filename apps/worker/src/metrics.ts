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