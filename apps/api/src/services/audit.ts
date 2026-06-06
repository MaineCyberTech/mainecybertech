import { getSupabaseAdmin } from "./supabase";

type AuditEventInput = {
  organizationId?: string | null;
  actorUserId?: string | null;
  actorType?: "user" | "system";
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logAuditEvent(input: AuditEventInput) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("audit_logs").insert({
    organization_id: input.organizationId ?? null,
    actor_user_id: input.actorUserId ?? null,
    actor_type: input.actorType ?? "user",
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("audit log insert failed", error);
  }
}
