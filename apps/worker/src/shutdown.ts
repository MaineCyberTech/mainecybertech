import { logger } from "./logger";

let shuttingDown = false;
let inFlightTasks: Promise<void>[] = [];

export function isShuttingDown(): boolean {
  return shuttingDown;
}

export function markShuttingDown(): void {
  shuttingDown = true;
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
