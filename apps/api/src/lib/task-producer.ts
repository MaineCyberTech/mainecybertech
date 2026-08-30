import { Queue } from "bullmq";
import { getEnv } from "../config/env";
import { logger } from "./logger";

export const TASK_QUEUE_NAME = "mct-tasks";
export const TASK_JOB_NAME = "task";

let queue: Queue | null = null;
let queueError: Error | null = null;
let enabled: boolean | null = null;

function safeGetEnv() {
  try {
    return getEnv();
  } catch {
    return null;
  }
}

function isTaskQueueEnabled(): boolean {
  if (enabled === null) {
    const env = safeGetEnv();
    enabled = env
      ? env.TASK_QUEUE_ENABLED !== undefined
        ? env.TASK_QUEUE_ENABLED === "true"
        : env.NODE_ENV === "production"
      : false;
  }
  return enabled;
}

function buildConnection(): { url: string; password?: string } {
  const env = getEnv();
  const connection: { url: string; password?: string } = { url: env.REDIS_URL! };
  if (env.REDIS_PASSWORD) {
    connection.password = env.REDIS_PASSWORD;
  }
  return connection;
}

function getQueue(): Queue | null {
  if (queue) return queue;

  const env = safeGetEnv();
  if (!env?.REDIS_URL) return null;

  try {
    queue = new Queue(TASK_QUEUE_NAME, {
      connection: buildConnection(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    });
    queue.on("error", (err) => {
      queueError = err instanceof Error ? err : new Error(String(err));
      logger.error({ error: queueError.message }, "Task queue (Redis) connection error");
    });
    return queue;
  } catch (err) {
    queueError = err instanceof Error ? err : new Error(String(err));
    logger.error({ error: queueError.message }, "Failed to create task queue");
    return null;
  }
}

/**
 * Enqueue a task for the worker's BullMQ consumer.
 *
 * Safe to call anywhere: never throws, never blocks the request path when
 * Redis is unreachable (logs a warning and returns false so callers can fall
 * back to fire-and-forget behavior).
 */
export async function enqueueTask(
  taskType: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  try {
    if (!isTaskQueueEnabled()) {
      return false;
    }

    const env = safeGetEnv();
    if (!env?.REDIS_URL) {
      logger.debug({ taskType }, "REDIS_URL not configured — skipping task enqueue");
      return false;
    }

    const q = getQueue();
    if (!q) return false;

    await q.add(TASK_JOB_NAME, { type: taskType, payload });
    logger.debug({ taskType }, "Task enqueued");
    return true;
  } catch (err) {
    queueError = err instanceof Error ? err : new Error(String(err));
    logger.warn(
      { taskType, error: queueError.message },
      "Failed to enqueue task — continuing without queue",
    );
    return false;
  }
}
