import { Worker as BullWorker, type Job } from "bullmq";
import { env, resolveRedisUrl } from "./env";
import { executeTask } from "./task-registry";
import { logger } from "./logger";
import { isShuttingDown, drainInFlight, markShuttingDown } from "./shutdown";
import { getConsumerConnection, reportConsumerConnection } from "./queue-state";

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
    logger.error(
      { jobId: job?.id, type: job?.data?.type, error: error.message },
      "BullMQ job failed permanently",
    );
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
      resolve();
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  });
}

import type { TaskMessage } from "./task-registry";
