import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requireIfMatch } from "../middleware/optimistic-locking";
import { sendExportResponse, CsvColumn } from "../lib/csv";
import {
  createDomainMonitorSchema,
  updateDomainMonitorSchema,
} from "../validators/domain-monitors";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

const exportColumns: CsvColumn[] = [
  { key: "id" },
  { key: "organization_id" },
  { key: "domain" },
  { key: "display_name" },
  { key: "ssl_expires" },
  { key: "ssl_valid" },
  { key: "spf_status" },
  { key: "dkim_status" },
  { key: "dmarc_status" },
  { key: "dns_provider" },
  { key: "last_checked_at" },
];

router.get("/export", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    let q = supabase.from("domain_monitors").select("*");
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) q = q.eq("organization_id", orgId);
    const { data, error } = await q.order("domain", { ascending: true }).limit(10000);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "domain_monitor.export",
      entityType: "domain_monitor",
    });
    sendExportResponse(res, data ?? [], exportColumns, "domain-monitors");
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    let q = supabase.from("domain_monitors").select("*", { count: "exact" });
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) q = q.eq("organization_id", orgId);
    const status = req.query.status as string | undefined;
    if (status) q = q.eq("status", status);
    const search = req.query.search as string | undefined;
    if (search) q = q.ilike("domain", `%${search}%`);
    const sslBefore = req.query.ssl_expiring_before as string | undefined;
    if (sslBefore) q = q.lte("ssl_expires", sslBefore).neq("ssl_expires", null as any);

    const { data, error, count } = await q
      .order("domain", { ascending: true })
      .range(offset, offset + limit - 1);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(
      success({ items: data ?? [], total: count ?? 0, page, limit } as PaginatedResult<unknown>),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    let q = supabase
      .from("domain_monitors")
      .select(
        "ssl_valid, spf_status, dkim_status, dmarc_status, ssl_expires, nameserver_mismatch, cloudflare_proxied",
      );
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) q = q.eq("organization_id", orgId);
    const { data, error } = await q;
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const items = data ?? [];
    let sslInvalid = 0,
      sslExpiring = 0,
      spfMissing = 0,
      dkimMissing = 0,
      dmarcMissing = 0,
      nsMismatch = 0,
      notProxied = 0;
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 86400000);

    for (const d of items) {
      const m = d as Record<string, unknown>;
      if (m.ssl_valid === false) sslInvalid++;
      if (m.spf_status === "missing" || m.spf_status === "invalid") spfMissing++;
      if (m.dkim_status === "missing" || m.dkim_status === "invalid") dkimMissing++;
      if (m.dmarc_status === "missing" || m.dmarc_status === "invalid") dmarcMissing++;
      if (m.nameserver_mismatch === true) nsMismatch++;
      if (m.cloudflare_proxied === false) notProxied++;
      const se = m.ssl_expires as string | null;
      if (se) {
        const d = new Date(se);
        if (d <= thirtyDays) sslExpiring++;
      }
    }

    res.json(
      success({
        total: items.length,
        sslInvalid,
        sslExpiring,
        spfMissing,
        dkimMissing,
        dmarcMissing,
        nsMismatch,
        notProxied,
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("domain_monitors")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "Domain monitor not found", 404);

    const [{ data: checks }] = await Promise.all([
      supabase
        .from("scheduled_check_results")
        .select("*")
        .eq("module_key", "domain-monitors")
        .eq("check_target", (data as { domain: string }).domain)
        .order("checked_at", { ascending: false })
        .limit(10),
    ]);

    res.json(success({ ...data, recentChecks: checks ?? [] }));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createDomainMonitorSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("domain_monitors")
      .insert({
        organization_id: parsed.organizationId,
        domain: parsed.domain,
        display_name: parsed.displayName ?? null,
        zone_id: parsed.zoneId ?? null,
        dns_provider: parsed.dnsProvider,
        cloudflare_proxied: parsed.cloudflareProxied,
        check_interval_hours: parsed.checkIntervalHours,
        alerts_enabled: parsed.alertsEnabled,
        owner_user_id: req.authUser!.userId,
        created_by: req.authUser!.userId,
        visibility: parsed.visibility,
        metadata: parsed.metadata ?? {},
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "domain_monitor.created",
      entityType: "domain_monitor",
      entityId: data.id,
      metadata: { domain: parsed.domain },
    });
    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireIfMatch, async (req, res, next) => {
  try {
    const parsed = updateDomainMonitorSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: current, error: fetchError } = await supabase
      .from("domain_monitors")
      .select("version, status")
      .eq("id", req.params.id)
      .single();
    if (fetchError || !current) throw new AppError("NOT_FOUND", "Domain monitor not found", 404);

    const fieldMap: Record<string, string> = {
      domain: "domain",
      displayName: "display_name",
      zoneId: "zone_id",
      dnsProvider: "dns_provider",
      cloudflareProxied: "cloudflare_proxied",
      checkIntervalHours: "check_interval_hours",
      alertsEnabled: "alerts_enabled",
      status: "status",
      visibility: "visibility",
      metadata: "metadata",
    };

    const updateData: Record<string, unknown> = {};
    for (const [k, col] of Object.entries(fieldMap)) {
      if ((parsed as Record<string, unknown>)[k] !== undefined)
        updateData[col] = (parsed as Record<string, unknown>)[k];
    }

    const { data, error } = await supabase
      .from("domain_monitors")
      .update(updateData)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Domain monitor not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "domain_monitor.updated",
      entityType: "domain_monitor",
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
    const { error } = await supabase.from("domain_monitors").delete().eq("id", req.params.id);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "domain_monitor.deleted",
      entityType: "domain_monitor",
      entityId: String(req.params.id),
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
