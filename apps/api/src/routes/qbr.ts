import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { createQbrReportSchema, updateQbrReportSchema } from "../validators/qbr";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

router.get("/", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    let q = supabase.from("qbr_reports").select("*", { count: "exact" });
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) q = q.eq("organization_id", orgId);

    const { data, error, count } = await q
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(
      success({ items: data ?? [], total: count ?? 0, page, limit } as PaginatedResult<unknown>),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("qbr_reports")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "Report not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/generate", async (req, res, next) => {
  try {
    const parsed = createQbrReportSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const orgId = parsed.organizationId;

    const [
      { count: ticketCount },
      { count: openTicketCount },
      { data: projects },
      { data: findings },
      { data: assets },
      { data: domainMonitors },
    ] = await Promise.all([
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId),
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .not("status", "in", '("resolved","closed","completed","cancelled")'),
      supabase
        .from("projects")
        .select("id, name, status, priority")
        .eq("organization_id", orgId)
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("findings")
        .select("id, title, severity, status")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("assets")
        .select("id, name, asset_type, status, warranty_expires")
        .eq("organization_id", orgId)
        .order("warranty_expires", { ascending: true })
        .limit(100),
      supabase
        .from("domain_monitors")
        .select("id, domain, ssl_valid, spf_status, dkim_status, dmarc_status")
        .eq("organization_id", orgId),
    ]);

    const assetList = assets ?? [];
    const now = new Date();
    const ninetyDays = new Date(now.getTime() + 90 * 86400000);
    const expiringWarranties = assetList.filter((a) => {
      const we = (a as { warranty_expires: string | null }).warranty_expires;
      return we && new Date(we) <= ninetyDays;
    });

    const monitoringAlerts = (domainMonitors ?? []).filter((d) => {
      const dm = d as Record<string, unknown>;
      return (
        dm.ssl_valid === false ||
        dm.spf_status === "missing" ||
        dm.dkim_status === "missing" ||
        dm.dmarc_status === "missing"
      );
    });

    const findingSummary = { p0: 0, p1: 0, p2: 0, p3: 0, open: 0, resolved: 0 };
    for (const f of findings ?? []) {
      const sev = (f as { severity: string }).severity as keyof typeof findingSummary;
      if (sev in findingSummary) findingSummary[sev]++;
      if (
        (f as { status: string }).status === "open" ||
        (f as { status: string }).status === "in_progress"
      )
        findingSummary.open++;
      if (
        (f as { status: string }).status === "resolved" ||
        (f as { status: string }).status === "verified"
      )
        findingSummary.resolved++;
    }

    const reportData = {
      generatedAt: new Date().toISOString(),
      period: { start: parsed.periodStart, end: parsed.periodEnd },
      tickets: { total: ticketCount ?? 0, open: openTicketCount ?? 0 },
      projects: {
        total: (projects ?? []).length,
        active: (projects ?? []).filter((p: { status: string }) => p.status === "active").length,
        recent: (projects ?? []).slice(0, 5),
      },
      findings: findingSummary,
      assets: {
        total: assetList.length,
        expiringWarranties: expiringWarranties.length,
        expiringItems: expiringWarranties
          .slice(0, 10)
          .map((a: { id: string; name: string; warranty_expires: string | null }) => ({
            id: (a as { id: string }).id,
            name: (a as { name: string }).name,
            expires: (a as { warranty_expires: string | null }).warranty_expires,
          })),
      },
      securityPosture: {
        monitoredDomains: (domainMonitors ?? []).length,
        alertCount: monitoringAlerts.length,
        alerts: monitoringAlerts.slice(0, 10),
      },
    };

    const { data, error } = await supabase
      .from("qbr_reports")
      .insert({
        organization_id: orgId,
        title: parsed.title,
        period_start: parsed.periodStart ?? null,
        period_end: parsed.periodEnd ?? null,
        status: "draft",
        visibility: parsed.visibility,
        report_data: reportData,
        generated_by: req.authUser!.userId,
        created_by: req.authUser!.userId,
        metadata: parsed.metadata ?? {},
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: req.authUser!.userId,
      action: "qbr.report.generated",
      entityType: "qbr_report",
      entityId: data.id,
      metadata: { title: parsed.title },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = updateQbrReportSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const updateData: Record<string, unknown> = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.status !== undefined) updateData.status = parsed.status;
    if (parsed.summary !== undefined) updateData.summary = parsed.summary;
    if (parsed.visibility !== undefined) updateData.visibility = parsed.visibility;
    if (parsed.metadata !== undefined) updateData.metadata = parsed.metadata;

    const { data, error } = await supabase
      .from("qbr_reports")
      .update(updateData)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Report not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: `qbr.report.${parsed.status === "sent" ? "sent" : "updated"}`,
      entityType: "qbr_report",
      entityId: data.id,
      metadata: parsed,
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("qbr_reports").delete().eq("id", req.params.id);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "qbr.report.deleted",
      entityType: "qbr_report",
      entityId: String(req.params.id),
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
