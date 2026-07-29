import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

const createSchema = z.object({
  organizationId: z.string().min(1),
  domain: z.string().min(1).max(200),
  dmarcRecord: z.string().max(5000).optional().nullable(),
  spfRecord: z.string().max(5000).optional().nullable(),
  dkimRecord: z.string().max(5000).optional().nullable(),
});

const updateSchema = z.object({
  domain: z.string().max(200).optional(),
  dmarcRecord: z.string().max(5000).optional().nullable(),
  spfRecord: z.string().max(5000).optional().nullable(),
  dkimRecord: z.string().max(5000).optional().nullable(),
});

function snakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
}

// List
router.get("/", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;
    const q = supabase
      .from("dmarc_analyses")
      .select("*", { count: "exact" })
      .eq("organization_id", req.query.organization_id as string)
      .order("created_at", { ascending: false });
    const { data, error, count } = await q.range(offset, offset + limit - 1);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success({ items: data ?? [], total: count ?? 0, page, limit }));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const orgId = req.query.organization_id as string;
    if (!orgId) throw new AppError("VALIDATION", "organization_id is required", 400);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("dmarc_analyses")
      .select("*")
      .eq("id", req.params.id)
      .eq("organization_id", orgId)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "Analysis not found", 404);
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const fields: Record<string, unknown> = {
      organization_id: parsed.organizationId,
      created_by: req.authUser!.userId,
    };
    for (const [k, v] of Object.entries(parsed)) {
      if (k === "organizationId") continue;
      if (v !== undefined && v !== null) fields[snakeCase(k)] = v;
    }
    const { data, error } = await supabase.from("dmarc_analyses").insert(fields).select().single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.status(201).json(success(data));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = updateSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v !== undefined) fields[snakeCase(k)] = v;
    }
    const { data, error } = await supabase
      .from("dmarc_analyses")
      .update(fields)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("dmarc_analyses").delete().eq("id", req.params.id);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Analyze endpoint
router.post("/analyze", async (req, res, next) => {
  try {
    const parsed = createSchema.parse(req.body);
    const dmarc = parsed.dmarcRecord || "";
    const spf = parsed.spfRecord || "";
    const dkim = parsed.dkimRecord || "";

    const issues: string[] = [];
    const recommendations: string[] = [];

    // DMARC analysis
    if (!dmarc) {
      issues.push("No DMARC record found");
      recommendations.push("Create a DMARC record starting with 'v=DMARC1; p=none;'");
    } else {
      if (dmarc.includes("p=none")) {
        issues.push("DMARC policy is set to 'none' — no enforcement");
        recommendations.push("Move to 'p=quarantine' after monitoring phase");
      }
      if (!dmarc.includes("p=reject") && !dmarc.includes("p=quarantine"))
        recommendations.push("Ultimate goal: 'p=reject' for maximum protection");
      if (!dmarc.includes("rua="))
        recommendations.push("Add rua= reporting address for aggregate reports");
      if (!dmarc.includes("pct=100")) recommendations.push("Set pct=100 for full coverage");
    }

    // SPF analysis
    if (!spf) {
      issues.push("No SPF record found");
      recommendations.push("Create an SPF record: 'v=spf1 include:_spf.example.com ~all'");
    }

    // DKIM analysis
    if (!dkim) {
      issues.push("No DKIM record provided");
      recommendations.push("Set up DKIM signing in your email provider");
    }

    // Grade
    let overallGrade = "F";
    if (dmarc && spf && dkim) overallGrade = "C";
    if (dmarc && spf && dkim && dmarc.includes("p=quarantine")) overallGrade = "B";
    if (dmarc && spf && dkim && dmarc.includes("p=reject") && dmarc.includes("pct=100"))
      overallGrade = "A";

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("dmarc_analyses")
      .insert({
        organization_id: parsed.organizationId,
        domain: parsed.domain,
        dmarc_record: dmarc,
        spf_record: spf,
        dkim_record: dkim,
        overall_grade: overallGrade,
        issues: JSON.stringify(issues),
        recommendations: JSON.stringify(recommendations),
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

export default router;
