import type { Request } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@mct/sdk/database.types";
import { getSupabaseAdmin } from "../services/supabase";
import { logImpersonation } from "../services/impersonation";
import { logger } from "../lib/logger";

/**
 * Run `fn` against the service-role (admin) Supabase client while recording an
 * audit/impersonation entry for the privilege escalation. This is the audited
 * wrapper around `getSupabaseAdmin` — it does NOT replace existing call sites
 * (broad conversion is a later phase). Use it when a request needs to act with
 * elevated (tenant-isolating-bypassing) privileges so the escalation is
 * traceable to the acting user and org.
 *
 * The audit write is fire-and-forget (mirrors `logImpersonation`); a logging
 * failure never blocks or fails the wrapped operation. If `fn` throws, the
 * error is rethrown after an error log so callers keep their behavior.
 */
export async function withServiceRole<T>(
  reason: string,
  req: Request,
  fn: (admin: SupabaseClient<Database>) => Promise<T>,
): Promise<T> {
  const actorUserId = req.authUser?.userId ?? null;
  const orgId = (req as { orgScope?: { orgId: string | null } }).orgScope?.orgId ?? null;

  await logImpersonation({
    actorUserId: actorUserId ?? "unknown",
    actorRoleKey: "service_role",
    organizationId: orgId,
    reason,
    source: "service_role.escalation",
    metadata: { timestamp: new Date().toISOString() },
    req,
  });

  try {
    return await fn(getSupabaseAdmin());
  } catch (err) {
    logger.error(
      { err, actorUserId, orgId, reason },
      "withServiceRole: wrapped escalation failed",
    );
    throw err;
  }
}
