import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { assertSafeWebhookUrl } from "../lib/ssrf-guard";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

const checkCreateSchema = z.object({
  organizationId: z.string().min(1),
  url: z.string().min(1).max(2000),
  checkType: z.string().default("http"),
  checkIntervalMinutes: z.number().int().min(1).max(1440).default(60),
  expectedStatusCode: z.number().int().min(100).max(599).default(200),
  timeoutSeconds: z.number().int().min(1).max(120).default(10),
  status: z.string().default("active"),
});

const checkUpdateSchema = z.object({
  url: z.string().max(2000).optional(),
  checkType: z.string().optional(),
  checkIntervalMinutes: z.number().int().min(1).max(1440).optional(),
  expectedStatusCode: z.number().int().min(100).max(599).optional(),
  timeoutSeconds: z.number().int().min(1).max(120).optional(),
  status: z.string().optional(),
});

router.get("/dashboard", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string;

    const { data: checks, error } = await supabase
      .from("uptime_checks")
      .select("*")
      .eq("organization_id", orgId);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const results = await Promise.all(
      (checks ?? []).map(async (check: any) => {
        const { data: lastResult } = await supabase
          .from("uptime_results")
          .select("*")
          .eq("check_id", check.id)
          .order("checked_at", { ascending: false })
          .limit(1)
          .single();

        const { count: totalChecks } = await supabase
          .from("uptime_results")
          .select("*", { count: "exact", head: true })
          .eq("check_id", check.id);

        const { count: upChecks } = await supabase
          .from("uptime_results")
          .select("*", { count: "exact", head: true })
          .eq("check_id", check.id)
          .eq("is_up", true);

        const total = totalChecks ?? 0;
        const up = upChecks ?? 0;
        const uptimePct = total > 0 ? ((up / total) * 100).toFixed(2) : "100.00";

        return {
          ...check,
          lastResult: lastResult ?? null,
          totalChecks: total,
          upChecks: up,
          uptimePct: parseFloat(uptimePct),
        };
      }),
    );

    const up = results.filter((r) => r.lastResult?.is_up === true).length;
    const down = results.filter((r) => r.lastResult?.is_up === false).length;
    const paused = results.filter((r) => r.status !== "active").length;

    res.json(
      success({
        checks: results,
        summary: {
          total: results.length,
          up,
          down,
          paused,
          overallUptime:
            results.length > 0 && results.every((r) => r.uptimePct !== undefined)
              ? parseFloat(
                  (results.reduce((s, r) => s + r.uptimePct, 0) / results.length).toFixed(2),
                )
              : 100,
        },
      }),
    );
  } catch (err) {
    next(err);
  }
});

router.get("/checks", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("uptime_checks")
      .select("*", { count: "exact" })
      .eq("organization_id", req.query.organization_id as string)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success({ items: data ?? [], total: count ?? 0, page, limit }));
  } catch (err) {
    next(err);
  }
});

router.get("/checks/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("uptime_checks")
      .select("*")
      .eq("id", req.params.id)
      .eq("organization_id", req.query.organization_id as string)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "Check not found", 404);
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});

router.post("/checks", async (req, res, next) => {
  try {
    const parsed = checkCreateSchema.parse(req.body);
    // SSRF guard — the worker fetches this URL; reject private / loopback /
    // link-local hosts before the check is ever stored.
    await assertSafeWebhookUrl(parsed.url);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("uptime_checks")
      .insert({
        organization_id: parsed.organizationId,
        url: parsed.url,
        check_type: parsed.checkType,
        check_interval_minutes: parsed.checkIntervalMinutes,
        expected_status_code: parsed.expectedStatusCode,
        timeout_seconds: parsed.timeoutSeconds,
        status: parsed.status,
        created_by: req.authUser!.userId,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "uptime_check.created",
      entityType: "uptime_check",
      entityId: data.id,
    });

    res.status(201).json(success(data));
  } catch (err) {
    next(err);
  }
});

router.patch("/checks/:id", async (req, res, next) => {
  try {
    const parsed = checkUpdateSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const fields: Record<string, unknown> = {};
    if (parsed.url !== undefined) {
      await assertSafeWebhookUrl(parsed.url);
      fields.url = parsed.url;
    }
    if (parsed.checkType !== undefined) fields.check_type = parsed.checkType;
    if (parsed.checkIntervalMinutes !== undefined)
      fields.check_interval_minutes = parsed.checkIntervalMinutes;
    if (parsed.expectedStatusCode !== undefined)
      fields.expected_status_code = parsed.expectedStatusCode;
    if (parsed.timeoutSeconds !== undefined) fields.timeout_seconds = parsed.timeoutSeconds;
    if (parsed.status !== undefined) fields.status = parsed.status;

    const { data, error } = await supabase
      .from("uptime_checks")
      .update(fields)
      .eq("id", req.params.id)
      .eq("organization_id", req.query.organization_id as string)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    res.json(success(data));
  } catch (err) {
    next(err);
  }
});

router.delete("/checks/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("uptime_checks")
      .delete()
      .eq("id", req.params.id)
      .eq("organization_id", req.query.organization_id as string);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get("/checks/:id/results", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: check, error: checkError } = await supabase
      .from("uptime_checks")
      .select("id")
      .eq("id", req.params.id)
      .eq("organization_id", req.query.organization_id as string)
      .single();
    if (checkError || !check) throw new AppError("NOT_FOUND", "Check not found", 404);
    const { data, error } = await supabase
      .from("uptime_results")
      .select("*")
      .eq("check_id", req.params.id)
      .order("checked_at", { ascending: false })
      .limit(30);

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (err) {
    next(err);
  }
});

router.get("/checks/:id/uptime", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date();

    const periods: { key: string; days: number }[] = [
      { key: "7d", days: 7 },
      { key: "30d", days: 30 },
      { key: "90d", days: 90 },
    ];

    const result: Record<string, { total: number; up: number; pct: number }> = {};

    const { data: check, error: checkError } = await supabase
      .from("uptime_checks")
      .select("id")
      .eq("id", req.params.id)
      .eq("organization_id", req.query.organization_id as string)
      .single();
    if (checkError || !check) throw new AppError("NOT_FOUND", "Check not found", 404);

    for (const period of periods) {
      const since = new Date(now.getTime() - period.days * 24 * 60 * 60 * 1000).toISOString();

      const { count: total, error: totalErr } = await supabase
        .from("uptime_results")
        .select("*", { count: "exact", head: true })
        .eq("check_id", req.params.id)
        .gte("checked_at", since);

      if (totalErr) throw new AppError("DB_ERROR", totalErr.message, 500);

      const { count: up, error: upErr } = await supabase
        .from("uptime_results")
        .select("*", { count: "exact", head: true })
        .eq("check_id", req.params.id)
        .eq("is_up", true)
        .gte("checked_at", since);

      if (upErr) throw new AppError("DB_ERROR", upErr.message, 500);

      const t = total ?? 0;
      const u = up ?? 0;

      result[period.key] = {
        total: t,
        up: u,
        pct: t > 0 ? parseFloat(((u / t) * 100).toFixed(2)) : 100,
      };
    }

    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

export default router;
