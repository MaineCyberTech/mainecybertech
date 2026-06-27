import { env } from "./env";
import { executeTask } from "./task-registry";
import { logger } from "./logger";
import {
  isShuttingDown,
  markShuttingDown,
  trackInFlight,
  drainInFlight,
} from "./shutdown";

interface SQSMessage {
  MessageId: string;
  Body: string;
  ReceiptHandle: string;
}

async function pollSQS(
  queueUrl: string,
  maxMessages: number,
  waitTimeSeconds: number,
): Promise<SQSMessage[]> {
  const { SQSClient, ReceiveMessageCommand } = await import("@aws-sdk/client-sqs");
  const client = new SQSClient({});

  const command = new ReceiveMessageCommand({
    QueueUrl: queueUrl,
    MaxNumberOfMessages: maxMessages,
    WaitTimeSeconds: waitTimeSeconds,
  });

  const response = await client.send(command);
  return (response.Messages ?? []) as SQSMessage[];
}

async function deleteMessage(
  queueUrl: string,
  receiptHandle: string,
): Promise<void> {
  const { SQSClient, DeleteMessageCommand } = await import("@aws-sdk/client-sqs");
  const client = new SQSClient({});

  await client.send(
    new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    }),
  );
}

async function processMessage(raw: SQSMessage): Promise<void> {
  let task: TaskMessage;
  try {
    task = JSON.parse(raw.Body);
  } catch {
    logger.warn({ messageId: raw.MessageId }, "Failed to parse message body");
    return;
  }

  logger.info({ type: task.type, messageId: raw.MessageId }, "Processing task");
  const result = await executeTask(task);

  if (result.ok) {
    logger.info(
      { type: task.type, messageId: raw.MessageId },
      "Task completed",
    );
    await deleteMessage(queueUrl, raw.ReceiptHandle);
  } else {
    logger.warn(
      { type: task.type, messageId: raw.MessageId, error: result.error },
      "Task failed — message will return to queue for retry",
    );
  }
}

import type { TaskMessage } from "./task-registry";

let queueUrl: string;

export async function runWorkerTasks(): Promise<void> {
  const backend = env.QUEUE_BACKEND;

  if (backend === "bullmq") {
    const { runBullMQWorker } = await import("./consumer-bullmq");
    await runBullMQWorker();
    return;
  }

  queueUrl = env.SQS_QUEUE_URL!;
  const concurrency = env.WORKER_CONCURRENCY;

  if (!queueUrl) {
    logger.warn(
      "SQS_QUEUE_URL not configured — worker will idle. Register tasks and provide a queue URL to process messages.",
    );
    await new Promise(() => {});
    return;
  }

  const shutdown = (): void => {
    if (isShuttingDown()) return;
    logger.info("Shutdown signal received — finishing current tasks...");
    markShuttingDown();
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  while (!isShuttingDown()) {
    try {
      const messages = await pollSQS(queueUrl, concurrency, 20);

      if (messages.length === 0) continue;

      const batchTasks = messages.map(async (msg) => {
        await processMessage(msg);
      });

      trackInFlight(...batchTasks);

      const results = await Promise.allSettled(batchTasks);

      for (const result of results) {
        if (result.status === "rejected") {
          logger.error({ error: result.reason }, "Failed to process message");
        }
      }
    } catch (error) {
      if (isShuttingDown()) break;
      logger.error({ error }, "Error polling SQS — will retry");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  await drainInFlight();
}