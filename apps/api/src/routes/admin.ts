import { Router } from "express";
import { z } from "zod";
import { renderEmailLayout } from "@mct/sdk/email-template";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { getSupabaseAdmin } from "../services/supabase";
import { rateLimitEmail } from "../middleware/rate-limit";
import { sendEmail } from "../lib/email";
import { AppError, success } from "../types";
import { logAuditEvent } from "../services/audit";
import { queryInt } from "../lib/query";
import { setActiveOrganizations } from "../lib/metrics";
import { enqueueTask } from "../lib/task-producer";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireAdmin);

// GET /api/v1/admin/organizations — list every tenant. Super admins only.
router.get("/organizations", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, queryInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, queryInt(req.query.limit, 25)));
    const offset = (page - 1) * limit;

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", req.authUser!.userId)
      .maybeSingle();

    if (!profile?.is_super_admin) {
      throw new AppError("FORBIDDEN", "Super admin access required", 403);
    }

    const query = supabase
      .from("organizations")
      .select("id, name, slug, status, primary_domain, support_plan, created_at", {
        count: "exact",
      })
      .order("name")
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    setActiveOrganizations(count ?? 0);
    res.json(success({ items: data ?? [], total: count ?? 0, page, limit }));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/admin/test-email — send a test email to verify SMTP config
router.post("/test-email", rateLimitEmail, async (req, res, next) => {
  try {
    const { to } = z.object({ to: z.string().email() }).parse(req.body);

    const sent = await sendEmail({
      to,
      subject: "MCT Portal — Test Email",
      text: "This is a test email from the Maine CyberTech Portal. If you received this, SMTP is configured correctly.",
      // NOTIF-P3-001: use the shared layout so the admin test exercises the
      // same branding as real notification mail.
      html: renderEmailLayout({
        heading: "✅ Test Email",
        bodyHtml:
          "<p>This is a test email from the <strong>Maine CyberTech Portal</strong>.</p><p>If you received this, SMTP is configured correctly.</p>",
      }),
    });

    if (!sent) {
      throw new AppError("SMTP_ERROR", "SMTP is not configured or sending failed", 502);
    }

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "admin.test_email",
      entityType: "admin",
      metadata: { to },
    });

    res.json(success({ sent: true, to }));
  } catch (error) {
    next(error);
  }
});

/**
 * API-P3-005: the batch Jira/JSM/M365 integration syncs are per-tenant tasks
 * that cannot run unattended — each needs an explicit project/organization
 * target — but nothing could enqueue them either. This super-admin endpoint is
 * the documented dispatch path (see docs/JIRA_JSM_INTEGRATION.md).
 */
const INTEGRATION_SYNC_TASKS = ["jira-sync", "jsm-sync", "m365-calendar-sync"] as const;

const integrationSyncSchema = z
  .object({
    task: z.enum(INTEGRATION_SYNC_TASKS),
    organizationId: z.string().uuid(),
    projectId: z.string().uuid().optional(),
    projectKey: z.string().min(1).max(100).optional(),
    userPrincipalName: z.string().min(3).max(320).optional(),
    batchSize: z.number().int().positive().max(500).optional(),
    fullSync: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.task === "m365-calendar-sync" && !value.projectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["projectId"],
        message: "projectId is required for m365-calendar-sync",
      });
    }
    if (value.task === "m365-calendar-sync" && !value.userPrincipalName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userPrincipalName"],
        message:
          "userPrincipalName is required for m365-calendar-sync (app-only tokens cannot use /me)",
      });
    }
  });

// POST /api/v1/admin/integration-syncs — enqueue a per-tenant batch sync
router.post("/integration-syncs", async (req, res, next) => {
  try {
    // Same platform-admin gate as GET /organizations: a tenant admin must not
    // be able to trigger integration work for another tenant.
    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", req.authUser!.userId)
      .maybeSingle();

    if (!profile?.is_super_admin) {
      throw new AppError("FORBIDDEN", "Super admin access required", 403);
    }

    const parsed = integrationSyncSchema.parse(req.body);
    const payload: Record<string, unknown> = { organizationId: parsed.organizationId };
    if (parsed.projectId) payload.projectId = parsed.projectId;
    if (parsed.projectKey) payload.projectKey = parsed.projectKey;
    if (parsed.userPrincipalName) payload.userPrincipalName = parsed.userPrincipalName;
    if (parsed.batchSize) payload.batchSize = parsed.batchSize;
    if (parsed.fullSync !== undefined) payload.fullSync = parsed.fullSync;

    const enqueued = await enqueueTask(parsed.task, payload);
    if (!enqueued) {
      throw new AppError(
        "QUEUE_UNAVAILABLE",
        "Task queue is not available; the integration sync was not enqueued",
        503,
      );
    }

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "admin.integration_sync.enqueued",
      entityType: "worker_task",
      entityId: parsed.task,
      metadata: payload,
    });

    res.json(success({ enqueued: true, task: parsed.task }));
  } catch (error) {
    next(error);
  }
});

export default router;
