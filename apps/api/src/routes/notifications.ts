import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { getSupabaseAdmin, getScopedClient } from "../services/supabase";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requireAdmin } from "../middleware/admin";
import { AppError, success } from "../types";
import { logAuditEvent } from "../services/audit";
import { getEnv } from "../config/env";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

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

// SSE stream for real-time notifications using Supabase realtime
router.get("/stream", async (req, res, next) => {
  try {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const supabase = getScopedClient(req, "notifications", "read");
    const userId = req.authUser!.userId;

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

    // Use Supabase realtime subscription for real-time notifications
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const safe = sanitizeNotification(payload.new as Record<string, unknown>);
          res.write(`event: notification\ndata: ${JSON.stringify(safe)}\n\n`);
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
          const safe = sanitizeNotification(payload.new as Record<string, unknown>);
          res.write(`event: notification_update\ndata: ${JSON.stringify(safe)}\n\n`);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          res.write(`data: ${JSON.stringify({ type: "subscribed" })}\n\n`);
        }
      });

    // Send initial unread notifications on connect
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const safe = data.map((n: Record<string, unknown>) => sanitizeNotification(n));
          res.write(`event: initial\ndata: ${JSON.stringify(safe)}\n\n`);
        }
      });

    req.on("close", () => {
      clearInterval(keepaliveInterval);
      supabase.removeChannel(channel);
      res.end();
    });
  } catch (error) {
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
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const unreadOnly = req.query.unread === "true";

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", req.authUser!.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) query = query.eq("read", false);

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
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.authUser!.userId)
      .eq("read", false);

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
      .eq("id", req.params.id)
      .eq("user_id", req.authUser!.userId)
      .select()
      .single();

    if (error || !data) throw new AppError("NOT_FOUND", "Notification not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "notification.read",
      entityType: "notification",
      entityId: req.params.id,
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

    const notificationKey = `${parsed.userId}-${parsed.module}-${parsed.moduleId || "none"}-${parsed.action}`;

    // Dedup: check if identical notification already exists
    const { data: existing } = await supabase
      .from("notifications")
      .select("id, title, body, read, created_at")
      .eq("notification_key", notificationKey)
      .maybeSingle();

    if (existing) {
      res.status(200).json(success(existing));
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: parsed.userId,
        organization_id: parsed.organizationId,
        title: parsed.title,
        body: parsed.body,
        module: parsed.module,
        module_id: parsed.moduleId,
        action: parsed.action,
        notification_key: notificationKey,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "notification.create",
      entityType: "notification",
      entityId: data.id,
      metadata: {
        userId: parsed.userId,
        module: parsed.module,
        action: parsed.action,
      },
    });

    res.status(201).json(success(data));
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
      .eq("id", req.params.id)
      .eq("user_id", req.authUser!.userId);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "notification.delete",
      entityType: "notification",
      entityId: req.params.id,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
