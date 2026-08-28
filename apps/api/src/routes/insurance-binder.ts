import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

const createEvidenceSchema = z.object({
  organizationId: z.string().min(1),
  evidenceType: z.string().max(100).optional().default("document"),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional().nullable(),
  fileUrl: z.string().max(2000).optional().nullable(),
  status: z.string().max(50).optional().default("pending"),
  coverageArea: z.string().max(100).optional().nullable(),
  insuranceProvider: z.string().max(255).optional().nullable(),
  policyNumber: z.string().max(255).optional().nullable(),
  expiryDate: z.string().nullable().optional(),
});

const updateEvidenceSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  fileUrl: z.string().max(2000).optional().nullable(),
  status: z.string().max(50).optional(),
  coverageArea: z.string().max(100).optional().nullable(),
  insuranceProvider: z.string().max(255).optional().nullable(),
  policyNumber: z.string().max(255).optional().nullable(),
  expiryDate: z.string().nullable().optional(),
  evidenceType: z.string().max(100).optional(),
});

const COVERAGE_AREAS = [
  "network_security",
  "endpoint_protection",
  "access_control",
  "data_backup",
  "incident_response",
  "employee_training",
  "vendor_management",
  "compliance",
];

type EvidenceSummaryRow = { coverage_area: string | null; status?: string | null };

// ── Coverage Report (before :id) ────────────────────────────────────

router.get("/coverage-report", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string;
    const { data, error } = await supabase
      .from("insurance_evidence")
      .select("coverage_area")
      .eq("organization_id", orgId);
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const items = data ?? [];
    const coverageMap: Record<string, boolean> = {};
    for (const area of COVERAGE_AREAS) {
      coverageMap[area] = items.some(
        (r: { coverage_area: string | null }) => r.coverage_area === area,
      );
    }
    const coveredCount = Object.values(coverageMap).filter(Boolean).length;
    const completeness = Math.round((coveredCount / COVERAGE_AREAS.length) * 100);

    const byCoverageArea: Record<string, { total: number; pending: number; verified: number }> = {};
    for (const area of COVERAGE_AREAS) {
      const areaItems = items.filter((r: EvidenceSummaryRow) => r.coverage_area === area);
      byCoverageArea[area] = {
        total: areaItems.length,
        pending: areaItems.filter((r: EvidenceSummaryRow) => r.status === "pending").length,
        verified: areaItems.filter((r: EvidenceSummaryRow) => r.status === "verified").length,
      };
    }

    res.json(
      success({
        organizationId: orgId,
        totalEvidence: items.length,
        completeness,
        byCoverageArea,
      }),
    );
  } catch (error) {
    next(error);
  }
});

// ── Evidence CRUD ────────────────────────────────────────────────────

router.get("/", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    const q = supabase
      .from("insurance_evidence")
      .select("*", { count: "exact" })
      .eq("organization_id", req.query.organization_id as string);

    if (req.query.coverage_area) {
      q.eq("coverage_area", req.query.coverage_area as string);
    }

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

router.post("/", async (req, res, next) => {
  try {
    const parsed = createEvidenceSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("insurance_evidence")
      .insert({
        organization_id: parsed.organizationId,
        evidence_type: parsed.evidenceType,
        title: parsed.title,
        description: parsed.description ?? null,
        file_url: parsed.fileUrl ?? null,
        status: parsed.status,
        coverage_area: parsed.coverageArea ?? null,
        insurance_provider: parsed.insuranceProvider ?? null,
        policy_number: parsed.policyNumber ?? null,
        expiry_date: parsed.expiryDate ?? null,
        created_by: req.authUser!.userId,
      })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "insurance.evidence.created",
      entityType: "insurance_evidence",
      entityId: data.id,
      metadata: { title: parsed.title },
    });
    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("insurance_evidence")
      .select("*")
      .eq("id", req.params.id)
      .eq("organization_id", req.query.organization_id as string)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "Evidence not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = updateEvidenceSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const updateData: Record<string, unknown> = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.fileUrl !== undefined) updateData.file_url = parsed.fileUrl;
    if (parsed.status !== undefined) updateData.status = parsed.status;
    if (parsed.coverageArea !== undefined) updateData.coverage_area = parsed.coverageArea;
    if (parsed.insuranceProvider !== undefined)
      updateData.insurance_provider = parsed.insuranceProvider;
    if (parsed.policyNumber !== undefined) updateData.policy_number = parsed.policyNumber;
    if (parsed.expiryDate !== undefined) updateData.expiry_date = parsed.expiryDate;
    if (parsed.evidenceType !== undefined) updateData.evidence_type = parsed.evidenceType;

    if (parsed.status === "verified" && !updateData.last_verified_at) {
      updateData.last_verified_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("insurance_evidence")
      .update(updateData)
      .eq("id", req.params.id)
      .eq("organization_id", req.query.organization_id as string)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Evidence not found", 404);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "insurance.evidence.updated",
      entityType: "insurance_evidence",
      entityId: data.id,
      metadata: updateData,
    });
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("insurance_evidence")
      .delete()
      .eq("id", req.params.id)
      .eq("organization_id", req.query.organization_id as string);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "insurance.evidence.deleted",
      entityType: "insurance_evidence",
      entityId: String(req.params.id),
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
