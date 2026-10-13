import promClient from "prom-client";

/**
 * Task execution counters shared by `task-registry.ts` (increments them) and
 * `metrics.ts` (registers them on the scrape registry).
 *
 * Dependency-free by design: `task-registry.ts` used to import them from
 * `metrics.ts`, which imports `getRegisteredTaskTypes` from
 * `task-registry.ts` — a live import cycle (HYGIENE-P3-009). Keeping the
 * counters in their own module (same pattern as `redis-failures.ts`) breaks
 * the cycle without changing behaviour.
 */
export const taskExecutionsTotal = new promClient.Counter({
  name: "worker_task_executions_total",
  help: "Total number of task executions",
  labelNames: ["task_type", "status"] as const,
});

export const taskExecutionDuration = new promClient.Histogram({
  name: "worker_task_execution_duration_seconds",
  help: "Task execution duration in seconds",
  labelNames: ["task_type"] as const,
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});
