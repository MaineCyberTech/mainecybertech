import type { Json } from "@mct/sdk/database.types";
import { getSupabaseAdmin } from "./services/supabase";
import { logger } from "./logger";
import { recordTaskDeadLetter } from "./metrics";

export interface TaskDeadLetterInput {
  taskType: string;
  payload: Record<string, unknown>;
  error: string;
  attempts: number;
}

/**
 * Persist a permanently failed task (RES-P2-002).
 *
 * BullMQ retries a failed job `attempts` times and then drops it from Redis;
 * without this row operators could not see or replay what failed. The metric
 * is recorded regardless of the insert outcome (the task did fail
 * permanently); a persistence error is logged so the gap stays visible.
 */
export async function writeTaskDeadLetter(entry: TaskDeadLetterInput): Promise<void> {
  recordTaskDeadLetter(entry.taskType);
  try {
    const { error } = await getSupabaseAdmin()
      .from("task_dead_letters")
      .insert({
        task_type: entry.taskType,
        payload: entry.payload as unknown as Json,
        error: entry.error,
        attempts: entry.attempts,
        last_attempt_at: new Date().toISOString(),
      });
    if (error) throw error;
    logger.warn(
      { taskType: entry.taskType, attempts: entry.attempts },
      "Task exhausted retries — written to task_dead_letters",
    );
  } catch (err) {
    logger.error(
      { taskType: entry.taskType, error: err instanceof Error ? err.message : String(err) },
      "Failed to persist task dead letter — failed work is not replayable",
    );
  }
}
