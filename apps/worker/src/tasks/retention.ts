import { createClient } from "@supabase/supabase-js";
import { env } from "../env";
import { logger } from "../logger";
import type { TaskHandler, TaskResult } from "../task-registry";

interface RetentionConfig {
  auditLogRetentionDays: number;
  notificationRetentionDays: number;
}

const DEFAULT_CONFIG: RetentionConfig = {
  auditLogRetentionDays: 365,
  notificationRetentionDays: 90,
};

export const retentionTask: TaskHandler = async (
  payload?: Record<string, unknown>,
): Promise<TaskResult> => {
  const config = {
    ...DEFAULT_CONFIG,
    ...(payload as Partial<RetentionConfig> | undefined),
  };

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const auditCutoff = new Date();
  auditCutoff.setDate(auditCutoff.getDate() - config.auditLogRetentionDays);

  const notificationCutoff = new Date();
  notificationCutoff.setDate(notificationCutoff.getDate() - config.notificationRetentionDays);

  const results: string[] = [];

  const { error: auditError } = await supabase
    .from("audit_logs")
    .delete()
    .lt("created_at", auditCutoff.toISOString());

  if (auditError) {
    results.push(`audit_logs purge failed: ${auditError.message}`);
  } else {
    results.push("audit_logs purged");
  }

  const { error: notifError } = await supabase
    .from("notifications")
    .delete()
    .lt("created_at", notificationCutoff.toISOString());

  if (notifError) {
    results.push(`notifications purge failed: ${notifError.message}`);
  } else {
    results.push("notifications purged");
  }

  logger.info(`[retention] ${results.join(", ")}`);
  return { ok: true };
};
