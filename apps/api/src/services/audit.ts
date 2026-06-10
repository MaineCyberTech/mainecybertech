import { getSupabaseAdmin } from "./supabase";
import { logger } from "../lib/logger";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 100;

type AuditEventInput = {
  organizationId?: string | null;
  actorUserId?: string | null;
  actorType?: "user" | "system";
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function logAuditEvent(input: AuditEventInput) {
  const supabase = getSupabaseAdmin();
  const data = {
    organization_id: input.organizationId ?? null,
    actor_user_id: input.actorUserId ?? null,
    actor_type: input.actorType ?? "user",
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const { error } = await supabase.from("audit_logs").insert(data);

    if (!error) return;

    if (attempt < MAX_RETRIES) {
      logger.warn(
        { err: error, attempt, maxRetries: MAX_RETRIES },
        "audit log insert failed, retrying",
      );
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    } else {
      logger.error(
        { err: error, attempt, maxRetries: MAX_RETRIES },
        "audit log insert failed after all retries — audit trail gap",
      );
    }
  }
}
