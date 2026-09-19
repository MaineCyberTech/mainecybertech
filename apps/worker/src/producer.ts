import { Queue } from "bullmq";
import { env } from "./env";
import { logger } from "./logger";

export const TASK_QUEUE_NAME = "mct-tasks";
export const TASK_JOB_NAME = "task";

let queue: Queue | null = null;
let queueError: Error | null = null;
let queueAttempted = false;

function isTaskQueueEnabled(): boolean {
  if (env.TASK_QUEUE_ENABLED !== undefined) {
    return env.TASK_QUEUE_ENABLED === "true";
  }
  return env.NODE_ENV === "production";
}

function buildConnection(): { url: string; password?: string } | null {
  if (!env.REDIS_URL) return null;
  const connection: { url: string; password?: string } = { url: env.REDIS_URL };
  if (env.REDIS_PASSWORD) {
    connection.password = env.REDIS_PASSWORD;
  }
  return connection;
}

function getQueue(): Queue | null {
  if (queue) return queue;
  if (queueAttempted) return null;
  if (!isTaskQueueEnabled()) return null;

  const connection = buildConnection();
  if (!connection) {
    logger.debug("REDIS_URL not configured — task queue unavailable");
    return null;
  }

  queueAttempted = true;
  try {
    queue = new Queue(TASK_QUEUE_NAME, {
      connection,
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

export async function enqueueTask(
  taskType: string,
  payload: Record<string, unknown>,
  opts?: { delayMs?: number },
): Promise<boolean> {
  if (!isTaskQueueEnabled()) {
    logger.debug({ taskType }, "Task queue disabled — skipping enqueue");
    return false;
  }

  const q = getQueue();
  if (!q) return false;

  try {
    await q.add(
      TASK_JOB_NAME,
      { type: taskType, payload },
      { delay: opts?.delayMs ? opts.delayMs : undefined },
    );
    logger.info({ taskType }, "Task enqueued");
    return true;
  } catch (err) {
    queueError = err instanceof Error ? err : new Error(String(err));
    logger.warn(
      { taskType, error: queueError.message },
      "Failed to enqueue task — falling back to direct execution",
    );
    return false;
  }
}

export async function getTaskQueueStats(): Promise<{
  waiting: number;
  active: number;
} | null> {
  if (!isTaskQueueEnabled()) return null;

  const q = getQueue();
  if (!q) return null;

  try {
    const [waiting, active] = await Promise.all([q.getWaitingCount(), q.getActiveCount()]);
    return { waiting, active };
  } catch (err) {
    logger.debug(
      { error: err instanceof Error ? err.message : String(err) },
      "Failed to read task queue stats",
    );
    return null;
  }
}

export function getTaskQueueHealth(): { connected: boolean; error?: string } {
  if (!isTaskQueueEnabled()) return { connected: true };
  if (!queue) return { connected: false, error: "queue not initialized" };
  return queueError ? { connected: false, error: queueError.message } : { connected: true };
}
