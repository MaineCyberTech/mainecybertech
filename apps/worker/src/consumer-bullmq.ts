import { Worker as BullWorker, type Job } from "bullmq";
import { env } from "./env";
import {
  executeTask,
  getRegisteredTaskTypes,
} from "./task-registry";
import { logger } from "./logger";
import { isShuttingDown, trackInFlight, drainInFlight } from "./shutdown";

let bullWorker: BullWorker | null = null;

export async function runBullMQWorker(): Promise<void> {
  const connection = { url: env.REDIS_URL };
  const concurrency = env.WORKER_CONCURRENCY;

  bullWorker = new BullWorker(
    "mct-tasks",
    async (job: Job) => {
      const task = job.data as TaskMessage;
      logger.info({ type: task.type, jobId: job.id }, "Processing BullMQ job");
      const result = await executeTask(task);
      if (!result.ok) {
        logger.warn(
          { type: task.type, jobId: job.id, error: result.error },
          "BullMQ job failed",
        );
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

  bullWorker.on("error", (error) => {
    logger.error({ error: error.message }, "BullMQ worker error");
  });

  logger.info(
    { concurrency, redisUrl: env.REDIS_URL },
    "BullMQ worker started",
  );

  await new Promise<void>((resolve) => {
    const shutdown = async () => {
      if (isShuttingDown()) return;
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