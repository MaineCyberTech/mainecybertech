import "dotenv/config";
import * as http from "http";
import pino from "pino";
import { z } from "zod";

// ============= Logger =============
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production"
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          singleLine: false,
          translateTime: "SYS:standard",
        },
      }
    : undefined,
});

// ============= Environment Validation =============
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]).default("info"),
  WORKER_CONCURRENCY: z.coerce.number().default(10),
  WORKER_TIMEOUT: z.coerce.number().default(30000),
  SQS_QUEUE_URL: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  JIRA_BASE_URL: z.string().optional(),
  JIRA_EMAIL: z.string().optional(),
  JIRA_API_TOKEN: z.string().optional(),
  JSM_BASE_URL: z.string().optional(),
  JSM_EMAIL: z.string().optional(),
  JSM_API_TOKEN: z.string().optional(),
  M365_TENANT_ID: z.string().optional(),
  M365_CLIENT_ID: z.string().optional(),
  M365_CLIENT_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  API_BASE_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  return envSchema.parse(raw);
}

let env: Env;
try {
  env = parseEnv(process.env);
  logger.info("Environment validation passed");
} catch (error) {
  logger.error(error, "Invalid environment variables");
  process.exit(1);
}

export { env };

// ============= Task Registry =============
export interface TaskMessage {
  type: string;
  payload: Record<string, unknown>;
}

export interface TaskResult {
  ok: boolean;
  error?: string;
}

export type TaskHandler = (payload: Record<string, unknown>) => Promise<TaskResult>;

const taskRegistry = new Map<string, TaskHandler>();

export function registerTask(type: string, handler: TaskHandler): void {
  if (taskRegistry.has(type)) {
    logger.warn({ type }, "Overwriting existing task handler");
  }
  taskRegistry.set(type, handler);
  logger.info({ type }, "Task handler registered");
}

export function getTaskHandler(type: string): TaskHandler | undefined {
  return taskRegistry.get(type);
}

export function getRegisteredTaskTypes(): string[] {
  return [...taskRegistry.keys()];
}

// ============= Task Execution =============
export async function executeTask(message: TaskMessage): Promise<TaskResult> {
  const handler = getTaskHandler(message.type);
  if (!handler) {
    logger.warn({ type: message.type }, "No handler registered for task type");
    return { ok: false, error: `Unknown task type: ${message.type}` };
  }

  try {
    const result = await handler(message.payload);
    return result;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error({ type: message.type, error: errMsg }, "Task handler threw");
    return { ok: false, error: errMsg };
  }
}

// ============= SQS Consumer =============
interface SQSMessage {
  MessageId: string;
  Body: string;
  ReceiptHandle: string;
}

// Poll messages from SQS queue.
// IMPORTANT: VisibilityTimeout in infra/terraform/compute.tf must be set to
// at least the maximum task runtime + buffer (currently 60s for stripe-reconcile,
// jira-sync, m365-calendar-sync, etc.). Tasks that take longer must update the
// Terraform configuration to avoid messages being reprocessed before completion.

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

async function deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
  const { SQSClient, DeleteMessageCommand } = await import("@aws-sdk/client-sqs");
  const client = new SQSClient({});

  await client.send(
    new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    }),
  );
}

async function processMessage(raw: SQSMessage): Promise<TaskResult> {
  let task: TaskMessage;
  try {
    task = JSON.parse(raw.Body);
  } catch {
    logger.warn({ messageId: raw.MessageId }, "Failed to parse message body");
    return { ok: true };
  }

  logger.info({ type: task.type, messageId: raw.MessageId }, "Processing task");
  const result = await executeTask(task);

  if (result.ok) {
    logger.info({ type: task.type, messageId: raw.MessageId }, "Task completed");
  } else {
    logger.warn({ type: task.type, messageId: raw.MessageId, error: result.error }, "Task failed");
  }

  return result;
}

let shuttingDown = false;

export async function runWorkerTasks(): Promise<void> {
  const queueUrl = env.SQS_QUEUE_URL;
  const concurrency = env.WORKER_CONCURRENCY;
  const timeout = env.WORKER_TIMEOUT;

  logger.info(
    { concurrency, timeout, queueUrl: queueUrl ?? "not configured" },
    "Worker started",
  );

  if (!queueUrl) {
    logger.warn("SQS_QUEUE_URL not configured â€” worker will idle. Register tasks and provide a queue URL to process messages.");
    await new Promise(() => {});
    return;
  }

  const shutdown = (): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("Shutdown signal received â€” finishing current tasks...");
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  while (!shuttingDown) {
    try {
      const messages = await pollSQS(queueUrl, concurrency, 20);

      if (messages.length === 0) continue;

      const results = await Promise.allSettled(
        messages.map(async (msg) => {
          const taskResult = await processMessage(msg);
          if (taskResult.ok) {
            await deleteMessage(queueUrl, msg.ReceiptHandle);
          } else {
            logger.warn(
              { messageId: msg.MessageId, error: taskResult.error },
              "Task failed — message will return to queue for retry",
            );
          }
        }),
      );

      for (const result of results) {
        if (result.status === "rejected") {
          logger.error({ error: result.reason }, "Failed to process message");
        }
      }
    } catch (error) {
      logger.error({ error }, "Error polling SQS â€” will retry");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  logger.info("Worker shut down gracefully");
}

// ============= Health Check Server =============
export function startHealthServer(port: number = 3001): void {
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        service: "worker",
        status: "healthy",
        uptime: process.uptime(),
        registeredTasks: getRegisteredTaskTypes(),
        shuttingDown,
      }));
    } else {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  server.listen(port, () => {
    logger.info({ port }, "Health check server started");
  });
  server.unref();
}

// ============= Register Built-in Tasks =============
registerTask("ping", async () => {
  logger.info("Ping task received â€” worker is alive");
  return { ok: true };
});

// ============= Register Integration Tasks =============
import { registerAllTasks } from "./tasks";
registerAllTasks();

// ============= Main =============
if (process.env.JEST_WORKER_ID === undefined && process.env.NODE_ENV !== "test") {
  startHealthServer(parseInt(process.env.HEALTH_PORT ?? "3001", 10));
  runWorkerTasks().catch((error) => {
    logger.error(error, "Worker crashed");
    process.exit(1);
  });
}
