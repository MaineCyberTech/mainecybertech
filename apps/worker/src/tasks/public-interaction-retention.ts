import { logger } from "../logger";
import { getSupabaseAdmin } from "../services/supabase";
import type { TaskResult } from "../task-registry";

const RETENTION_DAYS = 90;

export async function publicInteractionRetention(
  payload: Record<string, unknown>,
): Promise<TaskResult> {
  try {
    const retentionDays =
      typeof payload.retentionDays === "number" ? payload.retentionDays : RETENTION_DAYS;

    const cutoff = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const supabase = getSupabaseAdmin();

    const { data: deleted, error } = await supabase
      .from("public_interactions")
      .delete()
      .lt("created_at", cutoff)
      .select("id");

    if (error) {
      logger.error(
        { error: error.message, retentionDays, cutoff },
        "Public interaction retention purge failed",
      );
      return { ok: false, error: error.message };
    }

    const purged = deleted?.length ?? 0;
    logger.info({ purged, retentionDays, cutoff }, "Public interaction retention purge complete");
    return { ok: true };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error({ error: errMsg }, "Public interaction retention task failed");
    return { ok: false, error: errMsg };
  }
}
