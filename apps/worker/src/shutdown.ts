import { logger } from "./logger";
import { closeScanLock } from "./lib/scan-lock";
import { closeIdempotency } from "./lib/idempotency";
import { closeTaskQueue } from "./producer";

let shuttingDown = false;
let inFlightTasks: Promise<void>[] = [];

/**
 * Graceful-shutdown budget (RES-P3-001). A task that never settles would
 * otherwise hang the drain until the orchestrator SIGKILLs the container, with
 * no log explaining why. Arm an unref'd watchdog when shutdown starts: if the
 * process is still alive after the timeout, log and exit non-zero so the
 * failure is visible in the container logs.
 */
function resolveShutdownTimeoutMs(): number {
  const raw = Number(process.env.WORKER_SHUTDOWN_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 30_000;
}

const SHUTDOWN_TIMEOUT_MS = resolveShutdownTimeoutMs();
let watchdog: NodeJS.Timeout | null = null;

export function isShuttingDown(): boolean {
  return shuttingDown;
}

export function markShuttingDown(): void {
  shuttingDown = true;
  if (watchdog) return;
  watchdog = setTimeout(() => {
    logger.error(
      { timeoutMs: SHUTDOWN_TIMEOUT_MS },
      "Graceful shutdown timed out — forcing exit",
    );
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  // Unref so a clean drain lets the event loop empty and the process exit
  // normally before the watchdog fires; it only fires if something is still
  // holding the loop open.
  watchdog.unref();
}

/**
 * Track the tasks currently in flight.
 *
 * This REPLACES the set rather than appending: the SQS consumer awaits each
 * batch before polling again, so appending leaked one settled promise per
 * batch for the lifetime of the process.
 */
export function trackInFlight(...tasks: Promise<void>[]): void {
  inFlightTasks = tasks;
}

export async function drainInFlight(): Promise<void> {
  if (inFlightTasks.length === 0) return;
  logger.info({ count: inFlightTasks.length }, "Draining in-flight tasks...");
  const drainResults = await Promise.allSettled(inFlightTasks);
  for (const result of drainResults) {
    if (result.status === "rejected") {
      logger.error({ error: result.reason }, "In-flight task failed during drain");
    }
  }
  inFlightTasks = [];
  logger.info("Worker shut down gracefully");
}

/**
 * Close the Redis-backed handles the worker opens outside BullMQ's own
 * connections (RES-P2-009): the scan-lock client, the idempotency client and
 * the producer's task queue. Without this a completed drain still leaves open
 * sockets, so the process never exits on its own and Docker eventually
 * SIGKILLs it at the stop timeout. Best-effort: a handle that fails to close
 * must not abort the shutdown path (the force-exit watchdog is the backstop).
 */
export async function closeWorkerResources(): Promise<void> {
  await Promise.allSettled([closeScanLock(), closeIdempotency(), closeTaskQueue()]);
}
