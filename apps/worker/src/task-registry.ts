import * as Sentry from "@sentry/node";
import { env } from "./env";
import { logger } from "./logger";
import { taskExecutionsTotal, taskExecutionDuration } from "./metrics";

export interface TaskMessage {
  type: string;
  payload: Record<string, unknown>;
}

export interface TaskResult {
  ok: boolean;
  error?: string;
}

/**
 * Context passed to task handlers. The signal is aborted when the task
 * exceeds WORKER_TASK_TIMEOUT_MS (RES-P2-002) or when the caller cancels the
 * task. Handlers that run long loops (pagination, batch deletes) should check
 * `context.signal.aborted` and stop promptly; handlers that ignore it are
 * still failed by the registry once the deadline passes.
 */
export interface TaskExecutionContext {
  signal: AbortSignal;
}

export type TaskHandler = (
  payload: Record<string, unknown>,
  context?: TaskExecutionContext,
) => Promise<TaskResult>;

export interface ExecuteTaskOptions {
  /** Overrides WORKER_TASK_TIMEOUT_MS for this call (0 disables the deadline). */
  timeoutMs?: number;
  /** Additional cancellation signal (e.g. shutdown). */
  signal?: AbortSignal;
}

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

export async function executeTask(
  message: TaskMessage,
  options: ExecuteTaskOptions = {},
): Promise<TaskResult> {
  const handler = getTaskHandler(message.type);
  if (!handler) {
    logger.warn({ type: message.type }, "No handler registered for task type");
    taskExecutionsTotal.inc({ task_type: message.type, status: "no_handler" });
    return { ok: false, error: `Unknown task type: ${message.type}` };
  }

  // RES-P2-002: WORKER_TIMEOUT only configures the BullMQ lock; this deadline
  // is what actually fails a hung handler. Abort a controller at the deadline
  // (handlers can cooperate via the signal) and race it against the handler so
  // a handler that never settles cannot pin the worker forever.
  const timeoutMs = options.timeoutMs ?? env.WORKER_TASK_TIMEOUT_MS;
  const controller = new AbortController();
  let timedOut = false;
  let deadline: NodeJS.Timeout | undefined;

  const abortWith = (reason: string) => {
    if (!controller.signal.aborted) controller.abort(new Error(reason));
  };

  if (timeoutMs > 0) {
    deadline = setTimeout(() => {
      timedOut = true;
      abortWith(`Task ${message.type} exceeded WORKER_TASK_TIMEOUT_MS (${timeoutMs}ms)`);
    }, timeoutMs);
    deadline.unref();
  }

  const externalSignal = options.signal;
  const onExternalAbort = () => abortWith(`Task ${message.type} aborted by caller`);
  if (externalSignal) {
    if (externalSignal.aborted) onExternalAbort();
    else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }

  const abortPromise = new Promise<never>((_, reject) => {
    const onAbort = () =>
      reject(
        new Error(
          timedOut
            ? `Task ${message.type} timed out after ${timeoutMs}ms`
            : `Task ${message.type} aborted`,
        ),
      );
    if (controller.signal.aborted) onAbort();
    else controller.signal.addEventListener("abort", onAbort, { once: true });
  });

  const start = Date.now();
  try {
    const result = await Promise.race([
      handler(message.payload, { signal: controller.signal }),
      abortPromise,
    ]);
    const duration = (Date.now() - start) / 1000;
    taskExecutionDuration.observe({ task_type: message.type }, duration);

    if (result.ok) {
      taskExecutionsTotal.inc({ task_type: message.type, status: "success" });
    } else {
      taskExecutionsTotal.inc({ task_type: message.type, status: "failure" });
    }

    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    taskExecutionDuration.observe({ task_type: message.type }, duration);
    const errMsg = error instanceof Error ? error.message : String(error);

    if (timedOut) {
      taskExecutionsTotal.inc({ task_type: message.type, status: "timeout" });
      logger.error(
        { type: message.type, timeoutMs },
        "Task handler exceeded its deadline — failing the task",
      );
      return { ok: false, error: errMsg };
    }

    taskExecutionsTotal.inc({ task_type: message.type, status: "error" });
    logger.error({ type: message.type, error: errMsg }, "Task handler threw");
    // Do not forward the raw payload to Sentry — scheduled-notification and
    // ticket payloads can contain PII (titles, bodies, recipients). Keys are
    // enough to triage which task failed without shipping user data.
    Sentry.captureException(error, {
      extra: { taskType: message.type, payloadKeys: Object.keys(message.payload ?? {}) },
    });
    return { ok: false, error: errMsg };
  } finally {
    if (deadline) clearTimeout(deadline);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

// Register built-in ping task
registerTask("ping", async () => {
  logger.info("Ping task received — worker is alive");
  return { ok: true };
});
