import promClient from "prom-client";

/**
 * ARCH-P2-005: one non-replicated Redis backs the queue, cache, idempotency
 * and scan locks. When it fails, the worker's idempotency claim and scan lock
 * fall back to per-process behavior and only log at warn level — no alertable
 * signal. This counter records every such degradation so
 * infra/digitalocean/prometheus.rules.yml can alert on it.
 *
 * Kept dependency-free (prom-client only): the fallback paths import it, and
 * importing the full metrics registry (which pulls in the task registry and
 * producer) from them would add require cycles. metrics.ts registers this
 * counter with the worker registry.
 */
export const redisFailuresTotal = new promClient.Counter({
  name: "worker_redis_failures_total",
  help: "Worker Redis operation failures that degraded to a fallback path, by component and operation",
  labelNames: ["component", "operation"] as const,
});

export type WorkerRedisComponent = "idempotency" | "scan_lock";

export function recordRedisFailure(component: WorkerRedisComponent, operation: string): void {
  redisFailuresTotal.inc({ component, operation });
}
