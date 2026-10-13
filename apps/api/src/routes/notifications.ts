import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@mct/sdk/database.types";
import { getSupabaseAdmin, getScopedClient } from "../services/supabase";
import { requireAuth } from "../middleware/auth";
import {
  assertOrgScopeMatches,
  assertSharesActiveOrg,
  requireOrgAccess,
} from "../middleware/org-access";
import { requireAdmin } from "../middleware/admin";
import { AppError, success, failure } from "../types";
import { logAuditEvent } from "../services/audit";
import { getEnv } from "../config/env";
import { queryInt } from "../lib/query";
import { applyResolvedOrg } from "../lib/admin-scope";
import { buildNotificationKey, createNotification } from "../lib/notify";
import { listCountMode } from "../lib/pagination";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

/**
 * PERF-P2-005: SSE fan-out limits.
 *
 * A per-process cap rejects new streams with 503 + Retry-After once too many
 * are open (NotificationBell already falls back to polling on stream error),
 * and every stream for the same user shares one Supabase Realtime channel
 * instead of opening a channel each. Realtime subscriptions are then bounded
 * by distinct users rather than by open tabs/reconnect storms.
 */
export const SSE_MAX_STREAMS = 200;

let activeSseStreams = 0;

/** Reserve one of the per-process stream slots. */
export function acquireSseSlot(): boolean {
  if (activeSseStreams >= SSE_MAX_STREAMS) return false;
  activeSseStreams += 1;
  return true;
}

/** Release a slot taken by acquireSseSlot(). */
export function releaseSseSlot(): void {
  if (activeSseStreams > 0) activeSseStreams -= 1;
}

/** Test hook: number of SSE streams currently open. */
export function sseActiveStreams(): number {
  return activeSseStreams;
}

/** Test hook: reset the stream counter. */
export function resetSseStreams(): void {
  activeSseStreams = 0;
}

type NotificationSubscriber = (
  event: "notification" | "notification_update",
  row: Record<string, unknown>,
) => void;

interface SharedNotificationChannel {
  client: SupabaseClient<Database>;
  channel: RealtimeChannel;
  subscribers: Set<NotificationSubscriber>;
  pendingSubscribed: Set<() => void>;
  subscribed: boolean;
}

const sharedNotificationChannels = new Map<string, SharedNotificationChannel>();

/**
 * Subscribe to `notifications` changes for one user, sharing a single Supabase
 * Realtime channel across every SSE stream for that user. Returns an
 * unsubscribe function; the channel is removed when the last subscriber
 * leaves.
 */
export function subscribeToUserNotifications(
  client: SupabaseClient<Database>,
  userId: string,
  subscriber: NotificationSubscriber,
  onSubscribed?: () => void,
): () => void {
  const topic = `notifications:${userId}`;
  let entry = sharedNotificationChannels.get(topic);

  if (!entry) {
    const subscribers = new Set<NotificationSubscriber>();
    const pendingSubscribed = new Set<() => void>();
    const created: SharedNotificationChannel = {
      client,
      channel: null as unknown as RealtimeChannel,
      subscribers,
      pendingSubscribed,
      subscribed: false,
    };
    created.channel = client
      .channel(topic)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          for (const fn of subscribers) fn("notification", row);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          for (const fn of subscribers) fn("notification_update", row);
        },
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        created.subscribed = true;
        for (const notify of pendingSubscribed) notify();
        pendingSubscribed.clear();
      });
    sharedNotificationChannels.set(topic, created);
    entry = created;
  }

  entry.subscribers.add(subscriber);
  if (entry.subscribed) {
    onSubscribed?.();
  } else if (onSubscribed) {
    entry.pendingSubscribed.add(onSubscribed);
  }

  return () => {
    const current = sharedNotificationChannels.get(topic);
    if (!current) return;
    current.subscribers.delete(subscriber);
    if (onSubscribed) current.pendingSubscribed.delete(onSubscribed);
    if (current.subscribers.size === 0) {
      sharedNotificationChannels.delete(topic);
      current.client.removeChannel(current.channel);
    }
  };
}

/** Test hook: number of shared Supabase channels currently held. */
export function sharedNotificationChannelCount(): number {
  return sharedNotificationChannels.size;
}

/** Test hook: drop the shared-channel registry (does not unsubscribe). */
export function resetSharedNotificationChannels(): void {
  sharedNotificationChannels.clear();
}

function sanitizeNotification(n: Record<string, unknown>): Record<string, unknown> {
  return {
    id: n.id,
    title: n.title,
    module: n.module,
    module_id: n.module_id,
    action: n.action,
    read: n.read,
    created_at: n.created_at,
  };
}

/**
 * MT-P2-004: the SSE channel is scoped to the caller's resolved organization.
 * Supabase realtime `filter` supports a single column, so the user_id filter is
 * applied server-side and the org assertion is enforced here (and on the
 * initial query). Rows without a matching org are dropped, not streamed.
 */
export function notificationInScope(
  row: Record<string, unknown>,
  userId: string,
  scopedOrgId: string | undefined,
): boolean {
  if (row.user_id !== userId) return false;
  if (scopedOrgId && row.organization_id !== scopedOrgId) return false;
  return true;
}

// SSE stream for real-time notifications using Supabase realtime
router.get("/stream", async (req, res, next) => {
  // PERF-P2-005: refuse new streams once the per-process cap is reached.
  // The client falls back to polling, so a 503 degrades instead of hanging.
  if (!acquireSseSlot()) {
    res.setHeader("Retry-After", "10");
    res
      .status(503)
      .json(
        failure(
          "SERVICE_UNAVAILABLE",
          "Too many notification streams; retry shortly",
          503,
        ),
      );
    return;
  }
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    releaseSseSlot();
  };

  try {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const supabase = getScopedClient(req, "notifications", "read");
    const userId = req.authUser!.userId;
    // Resolved by requireOrgAccess; undefined only for un-pinned platform admins.
    const scopedOrgId = req.orgId ?? undefined;

    // Send initial heartbeat
    res.write(`data: ${JSON.stringify({ type: "connected", userId })}\n\n`);

    // Send keepalive every 30 seconds to prevent proxy idle connection drops
    const keepaliveInterval = setInterval(() => {
      res.write(": keepalive\n\n");
    }, 30_000);
    keepaliveInterval.unref();

    // Re-validate auth every 5 minutes to catch revoked sessions. The
    // EventSource client authenticates via cookie (no Bearer header), so we
    // re-check the signed JWT locally instead of calling Supabase with a
    // missing token (which would kill the stream for valid cookie sessions).
    const authValidationInterval = setInterval(
      () => {
        const token = req.userJwt;
        if (!token) {
          res.write(`event: auth_expired\ndata: ${JSON.stringify({ type: "auth_expired" })}\n\n`);
          res.end();
          return;
        }
        const env = getEnv();
        const secrets = env.JWT_SECRET.split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        let expired = true;
        for (const secret of secrets) {
          try {
            const decoded = jwt.verify(token, secret) as { exp?: number };
            if (!decoded.exp || decoded.exp * 1000 >= Date.now()) {
              expired = false;
              break;
            }
          } catch {
            // try next secret
          }
        }
        if (expired) {
          res.write(`event: auth_expired\ndata: ${JSON.stringify({ type: "auth_expired" })}\n\n`);
          res.end();
        }
      },
      5 * 60 * 1000,
    );
    authValidationInterval.unref();

    // Use a shared Supabase realtime subscription per user: two tabs (or a
    // reconnect storm) for the same user reuse one channel.
    const unsubscribe = subscribeToUserNotifications(
      supabase,
      userId,
      (event, row) => {
        if (!notificationInScope(row, userId, scopedOrgId)) return;
        const safe = sanitizeNotification(row);
        res.write(`event: ${event}\ndata: ${JSON.stringify(safe)}\n\n`);
      },
      () => {
        res.write(`data: ${JSON.stringify({ type: "subscribed" })}\n\n`);
      },
    );

    // Send initial unread notifications on connect
    let initialQuery = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(5);
    if (scopedOrgId) {
      initialQuery = initialQuery.eq("organization_id", scopedOrgId);
    }
    initialQuery
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const safe = data.map((n: Record<string, unknown>) => sanitizeNotification(n));
          res.write(`event: initial\ndata: ${JSON.stringify(safe)}\n\n`);
        }
      });

    req.on("close", () => {
      clearInterval(keepaliveInterval);
      clearInterval(authValidationInterval);
      unsubscribe();
      release();
      res.end();
    });
  } catch (error) {
    release();
    next(error);
  }
});

const createNotificationSchema = z.object({
  userId: z.string().min(1),
  organizationId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  module: z.enum(["tickets", "projects", "documents", "billing", "system"]),
  moduleId: z.string().optional(),
  action: z.enum([
    "created",
    "updated",
    "assigned",
    "due_soon",
    "overdue",
    "comment",
    "mention",
    "status_change",
  ]),
});

router.get("/", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "notifications", "read");
    const page = Math.max(1, queryInt(req.query.page, 1));
    const limit = Math.min(50, Math.max(1, queryInt(req.query.limit, 20)));
    const offset = (page - 1) * limit;
    const unreadOnly = req.query.unread === "true";

    let query = supabase
      .from("notifications")
      .select("*", { count: listCountMode(req.query) })
      .eq("user_id", req.authUser!.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) query = query.eq("read", false);
    // MT-P3-002: apply the same resolved-org predicate as the SSE stream, so
    // an org-less row cannot surface in a scoped member's inbox.
    query = applyResolvedOrg(req, query);

    const { data, error, count } = await query;
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    res.json(success({ items: data ?? [], total: count ?? 0, page, limit }));
  } catch (error) {
    next(error);
  }
});

router.get("/unread-count", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "notifications", "read");
    let query = supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.authUser!.userId)
      .eq("read", false);
    query = applyResolvedOrg(req, query);

    const { count, error } = await query;

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success({ count: count ?? 0 }));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/read", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "notifications", "write");
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("id", String(req.params.id))
      .eq("user_id", req.authUser!.userId)
      .select()
      .single();

    if (error || !data) throw new AppError("NOT_FOUND", "Notification not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "notification.read",
      entityType: "notification",
      entityId: String(req.params.id),
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/mark-all-read", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "notifications", "write");
    const orgId = req.query.organization_id as string | undefined;
    let query = supabase
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("user_id", req.authUser!.userId)
      .eq("read", false);

    if (orgId) {
      query = query.eq("organization_id", orgId);
    }

    const { error } = await query;

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "notification.mark_all_read",
      entityType: "notification",
    });

    res.json(success({ ok: true }));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const parsed = createNotificationSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    // MT-P3-002: the admin create endpoint is not a cross-tenant message drop.
    // The recipient must share the caller's resolved org (platform admins stay
    // cross-tenant by design), and the row must carry that org so org-less
    // rows cannot bypass the SSE/list scope assertion.
    await assertSharesActiveOrg(req, parsed.userId);
    if (parsed.organizationId) assertOrgScopeMatches(req, parsed.organizationId);
    const organizationId = parsed.organizationId ?? req.orgId ?? undefined;

    const notificationKey = buildNotificationKey({
      userId: parsed.userId,
      module: parsed.module,
      moduleId: parsed.moduleId,
      action: parsed.action,
      title: parsed.title,
      body: parsed.body,
    });

    // Route through the preference-aware helper (NOTIF-P1-001) instead of
    // inserting directly: an admin-authored notification must honour the
    // recipient's per-channel opt-outs and the same dedup key as every other
    // send path. No bypass: none of the actions this endpoint accepts are
    // security-critical alerts.
    const result = await createNotification({
      userId: parsed.userId,
      organizationId,
      title: parsed.title,
      body: parsed.body,
      module: parsed.module,
      moduleId: parsed.moduleId,
      action: parsed.action,
      notificationKey,
    });

    if (result.suppressed) {
      // The recipient disabled the in-app channel; report honestly rather than
      // inserting anyway. Still audited so an admin's intended send is visible.
      await logAuditEvent({
        actorUserId: req.authUser!.userId,
        action: "notification.create",
        entityType: "notification",
        metadata: {
          userId: parsed.userId,
          module: parsed.module,
          action: parsed.action,
          suppressed: true,
        },
      });
      res.status(200).json(success({ suppressed: true, deduped: false }));
      return;
    }

    // Return the persisted row (covers both a fresh insert and a dedup hit) so
    // the existing SDK `notifications.create()` contract is unchanged.
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("notification_key", notificationKey)
      .maybeSingle();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("DB_ERROR", "Notification was not persisted", 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "notification.create",
      entityType: "notification",
      entityId: data.id,
      metadata: {
        userId: parsed.userId,
        module: parsed.module,
        action: parsed.action,
        deduped: result.deduped,
      },
    });

    res.status(result.inserted ? 201 : 200).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "notifications", "write");
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", String(req.params.id))
      .eq("user_id", req.authUser!.userId);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "notification.delete",
      entityType: "notification",
      entityId: String(req.params.id),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
