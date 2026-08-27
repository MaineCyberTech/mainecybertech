import { getSupabaseAdmin } from "./supabase";
import { logger } from "../lib/logger";
import type { Request } from "express";

/**
 * Log platform-admin cross-tenant access (impersonation).
 *
 * Platform admin roles can operate across ALL tenants (see PLATFORM_ADMIN_KEYS
 * in roles.ts). Whenever such a user acts inside an organization they are NOT a
 * member of, we record it in impersonation_log so cross-tenant activity is
 * auditable (P0-7).
 *
 * Fire-and-forget: a logging failure must never block or fail the request.
 */
export async function logImpersonation(input: {
  actorUserId: string;
  actorRoleKey: string;
  organizationId: string | null;
  source?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  req?: Pick<Request, "ip" | "get"> | null;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("impersonation_log").insert({
      actor_user_id: input.actorUserId,
      actor_role_key: input.actorRoleKey,
      organization_id: input.organizationId,
      reason: input.reason ?? null,
      source: input.source ?? "api",
      metadata: input.metadata ?? {},
      ip_address: input.req?.ip ?? null,
      user_agent: input.req?.get?.("user-agent") ?? null,
    });

    if (error) {
      logger.warn(
        { err: error, actorUserId: input.actorUserId, orgId: input.organizationId },
        "impersonation log insert failed (non-blocking)",
      );
    }
  } catch (err) {
    logger.warn(
      { err },
      "impersonation log write threw (non-blocking)",
    );
  }
}
