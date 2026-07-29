import { z } from "zod";
import express, { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requireAdmin } from "../middleware/admin";
import {
  sop,
  compliance,
  insurance,
  aiPolicy,
  kb,
  training,
  phishing,
  scorecard,
  automation,
  ps,
  kbGen,
} from "../validators/edu-automation";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);
function snake(s: string) {
  return s.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
}
function crud(path: string, table: string, schema: z.ZodTypeAny) {
  router.get(`/${path}`, async (req, res, next) => {
    try {
      const sb = getSupabaseAdmin();
      const pg = Math.max(1, parseInt(req.query.page as string) || 1);
      const lm = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
      const q = sb
        .from(table)
        .select("*", { count: "exact" })
        .eq("organization_id", req.query.organization_id as string);
      const { data, error, count } = await q
        .order("created_at", { ascending: false })
        .range((pg - 1) * lm, (pg - 1) * lm + lm - 1);
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(
        success({
          items: data ?? [],
          total: count ?? 0,
          page: pg,
          limit: lm,
        } as PaginatedResult<unknown>),
      );
    } catch (e) {
      next(e);
    }
  });
  router.post(`/${path}`, async (req, res, next) => {
    try {
      const p = schema.parse(req.body) as Record<string, unknown>;
      const sb = getSupabaseAdmin();
      const f: Record<string, unknown> = { created_by: req.authUser!.userId };
      for (const [k, v] of Object.entries(p)) {
        if (k !== "organizationId") f[snake(k)] = v;
      }
      f.organization_id = p.organizationId as string;
      const { data, error } = await sb.from(table).insert(f).select().single();
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      await logAuditEvent({
        organizationId: f.organization_id as string,
        actorUserId: req.authUser!.userId,
        action: `${path}.created`,
        entityType: path,
        entityId: data.id,
      });
      res.status(201).json(success(data));
    } catch (e) {
      next(e);
    }
  });
  router.patch(`/${path}/:id`, async (req, res, next) => {
    try {
      const sb = getSupabaseAdmin();
      const f: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(req.body as Record<string, unknown>)) {
        if (k === "organizationId") continue;
        if (v !== undefined) f[snake(k)] = v;
      }
      const { data, error } = await sb
        .from(table)
        .update(f)
        .eq("id", req.params.id)
        .eq("organization_id", req.query.organization_id as string)
        .select()
        .single();
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      if (!data) throw new AppError("NOT_FOUND", "Not found", 404);
      await logAuditEvent({
        actorUserId: req.authUser!.userId,
        action: `${path}.updated`,
        entityType: path,
        entityId: data.id,
      });
      res.json(success(data));
    } catch (e) {
      next(e);
    }
  });

  router.delete(`/${path}/:id`, async (req, res, next) => {
    try {
      const sb = getSupabaseAdmin();
      const { error } = await sb
        .from(table)
        .delete()
        .eq("id", req.params.id)
        .eq("organization_id", req.query.organization_id as string);
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      await logAuditEvent({
        actorUserId: req.authUser!.userId,
        action: `${path}.deleted`,
        entityType: path,
        entityId: String(req.params.id),
      });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  });
}

type SchemaMap = Record<string, { schema: z.ZodTypeAny; table: string }>;
const schemas: SchemaMap = {
  sop: { schema: sop, table: "sop_library" },
  compliance: { schema: compliance, table: "compliance_readiness" },
  insurance: { schema: insurance, table: "insurance_evidence" },
  "ai-policy": { schema: aiPolicy, table: "ai_policies" },
  kb: { schema: kb, table: "knowledge_articles" },
  training: { schema: training, table: "training_modules" },
  phishing: { schema: phishing, table: "phishing_campaigns" },
  scorecards: { schema: scorecard, table: "cyber_scorecards" },
  automation: { schema: automation, table: "automation_workflows" },
  powershell: { schema: ps, table: "powershell_scripts" },
  "kb-generator": { schema: kbGen, table: "kb_article_generations" },
};

for (const [path, { schema: s, table }] of Object.entries(schemas)) {
  crud(path, table, s);
}

router.post("/automation/:id/execute", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: current, error: fetchError } = await supabase
      .from("automation_workflows")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (fetchError || !current) throw new AppError("NOT_FOUND", "Not found", 404);
    const { data, error } = await supabase
      .from("automation_workflows")
      .update({ status: "running", last_run_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});
router.post("/automation/:id/complete", async (req, res, next) => {
  try {
    const parsed = z.object({ result: z.string(), success: z.boolean() }).parse(req.body);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("automation_workflows")
      .update({
        status: parsed.success ? "completed" : "failed",
        last_result: parsed.result,
        last_run_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});
router.post("/kb-generator/:id/generate", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: current, error: fetchError } = await supabase
      .from("kb_article_generations")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (fetchError || !current) throw new AppError("NOT_FOUND", "Not found", 404);
    const generatedBody = `# ${current.title || "Generated Article"}\n\nThis article was auto-generated from the provided source.\n\n## Overview\n\nGenerated content based on KB generation request.\n\n## Key Points\n\n- Review and customize this content\n- Add relevant internal knowledge\n- Verify against current procedures\n\n## Next Steps\n\n1. Review the generated content\n2. Publish to the knowledge base\n3. Notify relevant team members`;
    const { data, error } = await supabase
      .from("kb_article_generations")
      .update({
        generated_body: generatedBody,
        status: "generated",
        generated_at: new Date().toISOString(),
        reviewed_by: req.authUser!.userId,
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});
router.get("/kb/search", async (req, res, next) => {
  try {
    const q = req.query.q as string;
    if (!q) throw new AppError("VALIDATION", "Search query required", 400);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("knowledge_articles")
      .select("*")
      .or(`title.ilike.%${q}%,body.ilike.%${q}%,category.ilike.%${q}%`)
      .eq("organization_id", req.query.organization_id as string)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success({ items: data ?? [], total: (data ?? []).length }));
  } catch (err) {
    next(err);
  }
});
router.post("/kb/:id/rate", async (req, res, next) => {
  try {
    const parsed = z.object({ helpful: z.boolean() }).parse(req.body);
    const supabase = getSupabaseAdmin();
    const field = parsed.helpful ? "helpful_count" : "not_helpful_count";
    await supabase.rpc("increment_article_count", { article_id: req.params.id, field_name: field });
    res.json(success({ rated: true }));
  } catch (err) {
    next(err);
  }
});
router.post("/compliance/score", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        organizationId: z.string().min(1),
        framework: z.string().min(1).max(100),
        responses: z.array(z.object({ questionId: z.string(), passed: z.boolean() })).min(1),
      })
      .parse(req.body);
    const supabase = getSupabaseAdmin();
    const totalQuestions = parsed.responses.length;
    const passed = parsed.responses.filter((r) => r.passed).length;
    const score = Math.round((passed / totalQuestions) * 100);
    const { data, error } = await supabase
      .from("compliance_readiness")
      .insert({
        organization_id: parsed.organizationId,
        framework: parsed.framework,
        score,
        total_questions: totalQuestions,
        passed_questions: passed,
        assessed_at: new Date().toISOString(),
        created_by: req.authUser!.userId,
      })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.status(201).json(success(data));
  } catch (err) {
    next(err);
  }
});

router.post("/phishing/:id/launch", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("phishing_campaigns")
      .update({ status: "active", launched_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .eq("status", "draft")
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});
router.get("/phishing/:id/results", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("phishing_campaigns")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "Campaign not found", 404);
    const sent = data.target_count || 0;
    const clicked = data.click_count || 0;
    const reported = data.reported_count || 0;
    res.json(
      success({
        ...data,
        clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
        reportRate: sent > 0 ? Math.round((reported / sent) * 100) : 0,
      }),
    );
  } catch (err) {
    next(err);
  }
});

const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\binvoke-expression\b|\biex\b/gi, label: "Invoke-Expression / iex" },
  { pattern: /remove-item\b.*-recurse.*-force/gi, label: "Remove-Item -Recurse -Force" },
  { pattern: /set-executionpolicy\s+bypass/gi, label: "Set-ExecutionPolicy Bypass" },
  {
    pattern: /invoke-webrequest\b.*-uri\s+https?:\/\//gi,
    label: "Invoke-WebRequest to external URL",
  },
  {
    pattern: /\bconvertto-securestring\b|\bget-credential\b/gi,
    label: "Credential manipulation (ConvertTo-SecureString/Get-Credential)",
  },
  {
    pattern: /\bnew-localuser\b|\badd-localgroupmember\b/gi,
    label: "Local user/group manipulation (New-LocalUser/Add-LocalGroupMember)",
  },
  { pattern: /\bnet\s+user\b|\bnet\s+localgroup\b/gi, label: "Net user/localgroup command" },
  { pattern: /\bstop-service\b|\brestart-computer\b/gi, label: "Stop-Service / Restart-Computer" },
  {
    pattern: /\bformat-volume\b|\bclear-disk\b/gi,
    label: "Disk formatting (Format-Volume/Clear-Disk)",
  },
  {
    pattern: /\binvoke-command\b.*-computername\b/gi,
    label: "Remote execution (Invoke-Command -ComputerName)",
  },
];

function scanForViolations(content: string): {
  violations: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
} {
  const violations: string[] = [];
  for (const { pattern, label } of DANGEROUS_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    if (re.test(content)) {
      violations.push(label);
    }
  }
  let riskLevel: "low" | "medium" | "high" | "critical" = "low";
  if (violations.length >= 4) riskLevel = "critical";
  else if (violations.length >= 3) riskLevel = "high";
  else if (violations.length >= 1) riskLevel = "medium";
  return { violations, riskLevel };
}

function psRoute(
  sub: string,
  handler: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => Promise<void>,
) {
  router.post(`/powershell/:id/${sub}`, handler);
}

psRoute("submit", async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { data: existing, error: fetchErr } = await sb
      .from("powershell_scripts")
      .select("id, status")
      .eq("id", req.params.id)
      .single();
    if (fetchErr || !existing) throw new AppError("NOT_FOUND", "Script not found", 404);
    if (existing.status !== "draft") {
      throw new AppError(
        "INVALID_STATE",
        `Cannot submit script with status "${existing.status}" — must be "draft"`,
        409,
      );
    }
    const { data, error } = await sb
      .from("powershell_scripts")
      .update({
        status: "pending_review",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "powershell.submit",
      entityType: "powershell_scripts",
      entityId: data.id,
    });
    res.json(success(data));
  } catch (e) {
    next(e);
  }
});

psRoute("check", async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { data: script, error: fetchErr } = await sb
      .from("powershell_scripts")
      .select("id, script_content")
      .eq("id", req.params.id)
      .single();
    if (fetchErr || !script) throw new AppError("NOT_FOUND", "Script not found", 404);
    const content = (script as Record<string, unknown>).script_content as string | null;
    if (!content) throw new AppError("INVALID_INPUT", "Script has no content to scan", 400);
    const { violations, riskLevel } = scanForViolations(content);
    const { data, error } = await sb
      .from("powershell_scripts")
      .update({
        policy_checked: true,
        policy_violations: violations,
        risk_level: riskLevel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "powershell.policy_check",
      entityType: "powershell_scripts",
      entityId: data.id,
    });
    res.json(success({ violations, riskLevel }));
  } catch (e) {
    next(e);
  }
});

psRoute("approve", async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { data: existing, error: fetchErr } = await sb
      .from("powershell_scripts")
      .select("id, status")
      .eq("id", req.params.id)
      .single();
    if (fetchErr || !existing) throw new AppError("NOT_FOUND", "Script not found", 404);
    if ((existing as Record<string, unknown>).status !== "pending_review") {
      throw new AppError(
        "INVALID_STATE",
        `Cannot approve script with status "${(existing as Record<string, unknown>).status}" — must be "pending_review"`,
        409,
      );
    }
    const { data, error } = await sb
      .from("powershell_scripts")
      .update({
        status: "approved",
        approved_by: req.authUser!.userId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "powershell.approve",
      entityType: "powershell_scripts",
      entityId: data.id,
    });
    res.json(success(data));
  } catch (e) {
    next(e);
  }
});

psRoute("reject", async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { data: existing, error: fetchErr } = await sb
      .from("powershell_scripts")
      .select("id, status")
      .eq("id", req.params.id)
      .single();
    if (fetchErr || !existing) throw new AppError("NOT_FOUND", "Script not found", 404);
    if ((existing as Record<string, unknown>).status !== "pending_review") {
      throw new AppError(
        "INVALID_STATE",
        `Cannot reject script with status "${(existing as Record<string, unknown>).status}" — must be "pending_review"`,
        409,
      );
    }
    const { data, error } = await sb
      .from("powershell_scripts")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "powershell.reject",
      entityType: "powershell_scripts",
      entityId: data.id,
    });
    res.json(success(data));
  } catch (e) {
    next(e);
  }
});

router.get("/scorecards/summary", async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const orgId = req.query.organization_id as string | undefined;

    let query = sb.from("cyber_scorecards").select("category, score, badge");
    if (orgId) query = query.eq("organization_id", orgId);
    const { data: scorecards, error } = await query;
    if (!scorecards || scorecards.length === 0) {
      return res.json(
        success({
          overallScore: 0,
          totalCategories: 0,
          badgesEarned: [],
          topCategory: null,
          lowestCategory: null,
          trend: "stable",
        }),
      );
    }

    const avg = Math.round(
      scorecards.reduce(
        (sum: number, sc: Record<string, unknown>) => sum + ((sc.score as number) ?? 0),
        0,
      ) / scorecards.length,
    );
    const badges = [
      ...new Set(
        scorecards.map((sc: Record<string, unknown>) => sc.badge).filter(Boolean) as string[],
      ),
    ];

    let topCategory = scorecards[0] as Record<string, unknown>;
    let lowestCategory = scorecards[0] as Record<string, unknown>;
    for (const sc of scorecards) {
      const s = sc as Record<string, unknown>;
      if (((s.score as number) ?? 0) > ((topCategory.score as number) ?? 0)) topCategory = s;
      if (((s.score as number) ?? 0) < ((lowestCategory.score as number) ?? 0)) lowestCategory = s;
    }

    const { data: history } = await sb
      .from("score_history")
      .select("score, recorded_at")
      .eq("organization_id", orgId)
      .order("recorded_at", { ascending: false })
      .limit(20);

    let trend: "improving" | "declining" | "stable" = "stable";
    if (history && history.length >= 4) {
      const midpoint = Math.floor(history.length / 2);
      const recent = history.slice(0, midpoint);
      const older = history.slice(midpoint);
      const recentAvg =
        recent.reduce((s: number, h: Record<string, unknown>) => s + (h.score as number), 0) /
        recent.length;
      const olderAvg =
        older.reduce((s: number, h: Record<string, unknown>) => s + (h.score as number), 0) /
        older.length;
      if (recentAvg - olderAvg > 5) trend = "improving";
      else if (olderAvg - recentAvg > 5) trend = "declining";
    }

    res.json(
      success({
        overallScore: avg,
        totalCategories: scorecards.length,
        badgesEarned: badges,
        topCategory: { category: topCategory.category, score: topCategory.score },
        lowestCategory: {
          category: lowestCategory.category,
          score: lowestCategory.score,
        },
        trend,
      }),
    );
  } catch (e) {
    next(e);
  }
});

router.get("/scorecards/overview", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("cyber_scorecards")
      .select("*")
      .eq("organization_id", req.query.organization_id as string);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    const items = data ?? [];
    const overallScore =
      items.length > 0
        ? Math.round(items.reduce((s: number, c: any) => s + (c.score || 0), 0) / items.length)
        : 0;
    const badges = [...new Set(items.map((c: any) => c.badge).filter(Boolean))];
    const categories = items.map((c: any) => ({
      category: c.category,
      score: c.score,
      maxScore: c.max_score,
      badge: c.badge,
    }));
    res.json(
      success({ overallScore, totalCategories: items.length, badgesEarned: badges, categories }),
    );
  } catch (err) {
    next(err);
  }
});

router.get("/scorecards/leaderboard", requireAdmin, async (_req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const { data: scorecards, error } = await sb
      .from("cyber_scorecards")
      .select("organization_id, score, organizations!inner(id, name)")
      .order("score", { ascending: false });

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const orgMap = new Map<string, { name: string; totalScore: number; count: number }>();
    for (const sc of scorecards ?? []) {
      const s = sc as Record<string, unknown>;
      const orgId = s.organization_id as string;
      const orgs = s.organizations as Record<string, unknown>;
      const existing = orgMap.get(orgId);
      if (existing) {
        existing.totalScore += (s.score as number) ?? 0;
        existing.count += 1;
      } else {
        orgMap.set(orgId, {
          name: orgs?.name as string,
          totalScore: (s.score as number) ?? 0,
          count: 1,
        });
      }
    }

    const ranked = [...orgMap.entries()]
      .map(([organizationId, data]) => ({
        organizationId,
        organizationName: data.name,
        overallScore: Math.round(data.totalScore / data.count),
        totalCategories: data.count,
      }))
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 10);

    res.json(success(ranked));
  } catch (e) {
    next(e);
  }
});

router.post("/scorecards/evaluate", async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const orgId = (req.body as Record<string, unknown>).organization_id as string | undefined;

    let query = sb.from("cyber_scorecards").select("id, category, score");
    if (orgId) query = query.eq("organization_id", orgId);
    const { data: scorecards, error } = await query;
    if (!scorecards || scorecards.length === 0) {
      return res.json(success({ evaluated: 0, badgesAssigned: [] }));
    }

    function badgeFor(score: number): string {
      if (score >= 90) return "Gold";
      if (score >= 70) return "Silver";
      if (score >= 50) return "Bronze";
      return "Needs Improvement";
    }

    function pointsFor(badge: string): number {
      if (badge === "Gold") return 100;
      if (badge === "Silver") return 75;
      if (badge === "Bronze") return 50;
      return 10;
    }

    const badgesAssigned: Array<{
      category: string;
      badge: string;
      score: number;
      points: number;
    }> = [];

    for (const sc of scorecards) {
      const s = sc as Record<string, unknown>;
      const badge = badgeFor((s.score as number) ?? 0);
      const points = pointsFor(badge);
      await sb
        .from("cyber_scorecards")
        .update({ badge, last_updated: new Date().toISOString() })
        .eq("id", s.id);
      await sb.from("score_history").insert({
        organization_id: orgId,
        category: s.category,
        score: s.score,
        recorded_at: new Date().toISOString(),
      });
      await sb.from("badges_earned").insert({
        organization_id: orgId,
        badge_name: badge,
        category: s.category,
        earned_at: new Date().toISOString(),
        points,
      });
      badgesAssigned.push({
        category: s.category as string,
        badge,
        score: (s.score as number) ?? 0,
        points,
      });
    }

    const overallAvg =
      scorecards.reduce(
        (sum: number, sc: Record<string, unknown>) => sum + ((sc.score as number) ?? 0),
        0,
      ) / scorecards.length;
    if (overallAvg >= 80) {
      await sb.from("badges_earned").insert({
        organization_id: orgId,
        badge_name: "Security Champion",
        category: null,
        earned_at: new Date().toISOString(),
        points: 200,
      });
      badgesAssigned.push({
        category: "Overall",
        badge: "Security Champion",
        score: Math.round(overallAvg),
        points: 200,
      });
    }

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: req.authUser!.userId,
      action: "scorecards.evaluated",
      entityType: "scorecards",
    });

    res.json(
      success({
        evaluated: scorecards.length,
        badgesAssigned,
        overallAvg: Math.round(overallAvg),
      }),
    );
  } catch (e) {
    next(e);
  }
});

export default router;
