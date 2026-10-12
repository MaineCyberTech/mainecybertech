import { Router } from "express";
import { z } from "zod";
import { getScopedClient } from "../services/supabase";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { AppError, success } from "../types";
import { logAuditEvent } from "../services/audit";
import { getEnv } from "../config/env";

/**
 * Web Push subscriptions (NOTIF-P2-001).
 *
 * The browser mints an endpoint + encryption keys via `pushManager.subscribe`
 * and POSTs them here; the worker later reads the active rows and sends
 * encrypted pushes. Subscriptions are per-user device capabilities, so they
 * are owner-scoped (RLS: user_id = auth.uid()), with organization_id recorded
 * as context when one is resolved.
 *
 * Unsubscribe is a soft revoke: the row is kept (revoked_at set) so an
 * operator can still see which devices were dropped, and the worker stops
 * selecting it.
 */

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);

/**
 * Browsers only issue HTTPS push endpoints. The worker additionally runs the
 * SSRF guard (DNS pinned to the validated address) before sending, so a
 * crafted endpoint cannot reach internal hosts.
 */
const subscriptionSchema = z.object({
  endpoint: z
    .string()
    .max(2048)
    .url()
    .refine((value) => value.startsWith("https://"), "endpoint must be an https URL"),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
  organizationId: z.string().uuid().optional(),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().max(2048).url(),
});

/**
 * VAPID public key for `pushManager.subscribe({ applicationServerKey })`.
 *
 * Auth-only (no org required): the key is not tenant data. When the operator
 * has not configured VAPID the channel is disabled and `enabled` is false —
 * the web UI hides the subscribe control instead of failing.
 */
router.get("/vapid-public-key", (_req, res) => {
  const publicKey = getEnv().VAPID_PUBLIC_KEY;
  res.json(success({ enabled: Boolean(publicKey), publicKey: publicKey ?? null }));
});

router.post("/", requireOrgAccess, async (req, res, next) => {
  try {
    const body = subscriptionSchema.parse(req.body);
    const supabase = getScopedClient(req, "push-subscriptions", "write");

    const orgId = req.orgId ?? body.organizationId ?? null;

    // Upsert on the endpoint: a browser re-subscribing (or a new user signing
    // in on the same browser) must update the row, not duplicate it, and a
    // revoked subscription becomes active again.
    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: req.authUser!.userId,
          organization_id: orgId,
          endpoint: body.endpoint,
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
          user_agent: (req.get("user-agent") ?? "").slice(0, 512) || null,
          revoked_at: null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      )
      .select("id, endpoint")
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "push_subscription.subscribe",
      entityType: "push_subscription",
      entityId: data.id,
      metadata: { organizationId: orgId },
    });

    res.json(success({ id: data.id, endpoint: data.endpoint }));
  } catch (error) {
    next(error);
  }
});

router.delete("/", requireOrgAccess, async (req, res, next) => {
  try {
    const { endpoint } = unsubscribeSchema.parse(req.body);
    const supabase = getScopedClient(req, "push-subscriptions", "write");

    // Owner filter is explicit even though RLS may be bypassed (service role):
    // a caller must never be able to revoke another user's subscription.
    const { data, error } = await supabase
      .from("push_subscriptions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("user_id", req.authUser!.userId)
      .eq("endpoint", endpoint)
      .select("id");

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "push_subscription.unsubscribe",
      entityType: "push_subscription",
      metadata: { revoked: data?.length ?? 0 },
    });

    res.json(success({ revoked: data?.length ?? 0 }));
  } catch (error) {
    next(error);
  }
});

export default router;
