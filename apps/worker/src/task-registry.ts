import * as Sentry from "@sentry/node";
import { logger } from "./logger";

export interface TaskMessage {
  type: string;
  payload: Record<string, unknown>;
}

export interface TaskResult {
  ok: boolean;
  error?: string;
}

export type TaskHandler = (
  payload: Record<string, unknown>,
) => Promise<TaskResult>;

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
    Sentry.captureException(error, {
      extra: { taskType: message.type, payload: message.payload },
    });
    return { ok: false, error: errMsg };
  }
}

// Register built-in ping task
registerTask("ping", async () => {
  logger.info("Ping task received — worker is alive");
  return { ok: true };
});