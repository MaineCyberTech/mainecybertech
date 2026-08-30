import { getSupabaseAdmin } from "./supabase";
import { logAuditEvent } from "./audit";
import { logger } from "../lib/logger";

export interface ApprovalRecord {
  id: string;
  organization_id: string;
  request_type: string;
  request_subject: string;
  request_body: string | null;
  request_metadata: Record<string, unknown>;
  source_module: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  status: string;
  priority: string;
  requested_by: string | null;
  assigned_to: string | null;
  approved_by: string | null;
  rejected_by: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  due_at: string | null;
  visibility: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export async function getApprovalStats(organizationId?: string) {
  const supabase = getSupabaseAdmin();

  let baseQuery = supabase.from("approval_requests").select("status");
  if (organizationId) baseQuery = baseQuery.eq("organization_id", organizationId);

  const { data, error } = await baseQuery;
  if (error) throw error;

  const stats = {
    total: data.length,
    pending: data.filter((r) => r.status === "pending").length,
    approved: data.filter((r) => r.status === "approved").length,
    rejected: data.filter((r) => r.status === "rejected").length,
    overdue: 0,
  };

  return stats;
}

export async function findApprovalById(id: string): Promise<ApprovalRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as ApprovalRecord;
}

export async function approveRequest(
  requestId: string,
  approvedBy: string,
  organizationId: string,
  notes?: string | null,
) {
  const supabase = getSupabaseAdmin();

  const existing = await findApprovalById(requestId);
  if (!existing) throw new Error("Approval request not found");
  if (existing.status !== "pending") throw new Error("Request is no longer pending");

  const { data, error } = await supabase
    .from("approval_requests")
    .update({
      status: "approved",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      request_metadata: {
        ...existing.request_metadata,
        approval_notes: notes || null,
      },
      version: existing.version + 1,
    })
    .eq("id", requestId)
    .eq("version", existing.version)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Version conflict — request modified by another user");

  try {
    await logAuditEvent({
      organizationId,
      actorUserId: approvedBy,
      action: `approval.${existing.request_type}.approved`,
      entityType: "approval_request",
      entityId: requestId,
      metadata: {
        requestType: existing.request_type,
        requestSubject: existing.request_subject,
        notes,
      },
    });
  } catch (auditErr) {
    logger.error({ err: auditErr }, "audit log failed during approval");
  }

  return data as ApprovalRecord;
}

export async function rejectRequest(
  requestId: string,
  rejectedBy: string,
  organizationId: string,
  reason: string,
) {
  const supabase = getSupabaseAdmin();

  const existing = await findApprovalById(requestId);
  if (!existing) throw new Error("Approval request not found");
  if (existing.status !== "pending") throw new Error("Request is no longer pending");

  const { data, error } = await supabase
    .from("approval_requests")
    .update({
      status: "rejected",
      rejected_by: rejectedBy,
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
      version: existing.version + 1,
    })
    .eq("id", requestId)
    .eq("version", existing.version)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Version conflict — request modified by another user");

  try {
    await logAuditEvent({
      organizationId,
      actorUserId: rejectedBy,
      action: `approval.${existing.request_type}.rejected`,
      entityType: "approval_request",
      entityId: requestId,
      metadata: {
        requestType: existing.request_type,
        requestSubject: existing.request_subject,
        reason,
      },
    });
  } catch (auditErr) {
    logger.error({ err: auditErr }, "audit log failed during rejection");
  }

  return data as ApprovalRecord;
}

export async function cancelRequest(
  requestId: string,
  cancelledBy: string,
  organizationId: string,
  reason?: string | null,
) {
  const supabase = getSupabaseAdmin();

  const existing = await findApprovalById(requestId);
  if (!existing) throw new Error("Approval request not found");

  const { data, error } = await supabase
    .from("approval_requests")
    .update({
      status: "cancelled",
      rejection_reason: reason || null,
      version: existing.version + 1,
    })
    .eq("id", requestId)
    .eq("version", existing.version)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Version conflict — request modified by another user");

  try {
    await logAuditEvent({
      organizationId,
      actorUserId: cancelledBy,
      action: "approval.cancelled",
      entityType: "approval_request",
      entityId: requestId,
      metadata: { reason },
    });
  } catch (auditErr) {
    logger.error({ err: auditErr }, "audit log failed during cancellation");
  }

  return data as ApprovalRecord;
}

export async function addTimelineEvent(
  organizationId: string,
  moduleKey: string,
  entityType: string,
  entityId: string,
  eventType: string,
  eventData: Record<string, unknown>,
  actorUserId?: string | null,
) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("module_timeline_events").insert({
    organization_id: organizationId,
    module_key: moduleKey,
    entity_type: entityType,
    entity_id: entityId,
    event_type: eventType,
    event_data: eventData,
    actor_user_id: actorUserId || null,
  });

  if (error) {
    logger.error({ err: error }, "failed to add timeline event");
  }
}
