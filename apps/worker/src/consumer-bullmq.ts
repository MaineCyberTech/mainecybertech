import { Worker as BullWorker, type Job } from "bullmq";
import { env, resolveRedisUrl } from "./env";
import { executeTask } from "./task-registry";
import { logger } from "./logger";
import {
  isShuttingDown,
  drainInFlight,
  markShuttingDown,
  closeWorkerResources,
} from "./shutdown";
import { getConsumerConnection, reportConsumerConnection } from "./queue-state";
import { writeTaskDeadLetter } from "./task-dead-letters";

let bullWorker: BullWorker | null = null;

export async function runBullMQWorker(): Promise<void> {
  if (!env.REDIS_URL) {
    logger.warn("REDIS_URL not configured — BullMQ worker cannot start");
    return;
  }
  const connection = { url: resolveRedisUrl(env.REDIS_URL, env.REDIS_PASSWORD) };
  const concurrency = env.WORKER_CONCURRENCY;

  bullWorker = new BullWorker(
    "mct-tasks",
    async (job: Job) => {
      const task = job.data as TaskMessage;
      logger.info({ type: task.type, jobId: job.id }, "Processing BullMQ job");
      const result = await executeTask(task);
      if (!result.ok) {
        logger.warn({ type: task.type, jobId: job.id, error: result.error }, "BullMQ job failed");
        throw new Error(result.error);
      }
      return result;
    },
    {
      connection,
      concurrency,
      lockDuration: env.WORKER_TIMEOUT,
    },
  );

  bullWorker.on("failed", (job, error) => {
    const task = job?.data as TaskMessage | undefined;
    const attemptsMade = job?.attemptsMade ?? 0;
    const maxAttempts = job?.opts?.attempts ?? 1;
    logger.error(
      { jobId: job?.id, type: task?.type, error: error.message, attemptsMade, maxAttempts },
      "BullMQ job failed",
    );
    // RES-P2-002: once the retries are exhausted the job falls out of Redis.
    // Persist it to the task dead-letter set so the failure is queryable and
    // replayable, and let worker_task_dead_letters_total drive the alert.
    if (task?.type && attemptsMade >= maxAttempts) {
      void writeTaskDeadLetter({
        taskType: task.type,
        payload: task.payload ?? {},
        error: error.message,
        attempts: attemptsMade,
      });
    }
  });

  // RES-P2-008: feed the consumer's BullMQ connection state into the
  // worker_queue_connected gauge and the /health probe. "ready" fires on the
  // blocking connection's first connect and on every reconnect;
  // "ioredis:close" fires when the connection drops. Generic errors are logged
  // but do not flip the state - only connection lifecycle events do.
  bullWorker.on("ready", () => {
    reportConsumerConnection(true);
    logger.info("BullMQ worker Redis connection ready");
  });

  bullWorker.on("ioredis:close", () => {
    reportConsumerConnection(false, "Redis connection closed");
    logger.warn("BullMQ worker Redis connection closed");
  });

  bullWorker.on("closing", () => {
    reportConsumerConnection(false, "worker closing");
  });

  bullWorker.on("error", (error) => {
    // Surface the first connection error before "ready" so the health payload
    // explains why the consumer never connected.
    if (!getConsumerConnection().connected) {
      reportConsumerConnection(false, error.message);
    }
    logger.error({ error: error.message }, "BullMQ worker error");
  });

  const redisHost = (() => {
    try {
      return new URL(env.REDIS_URL ?? "").host || "unknown";
    } catch {
      return "unknown";
    }
  })();
  logger.info({ concurrency, redisHost }, "BullMQ worker started");

  await new Promise<void>((resolve) => {
    const shutdown = async () => {
      if (isShuttingDown()) return;
      markShuttingDown();
      logger.info("Shutdown signal received — closing BullMQ worker...");
      await bullWorker?.close();
      await drainInFlight();
      // RES-P2-009: release the Redis-backed handles (scan lock, idempotency,
      // producer queue) so the event loop can empty. Open sockets would keep
      // the process alive until Docker's stop timeout SIGKILLs it.
      await closeWorkerResources();
      logger.info("Worker shut down gracefully");
      resolve();
      process.exit(0);
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  });
}

import type { TaskMessage } from "./task-registry";
