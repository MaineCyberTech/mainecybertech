import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

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
      const areaItems = items.filter(
        (r: { coverage_area: string | null }) => r.coverage_area === area,
      );
      byCoverageArea[area] = {
        total: areaItems.length,
        pending: areaItems.filter(
          (r: { status?: string }) => (r as Record<string, unknown>).status === "pending",
        ).length,
        verified: areaItems.filter(
          (r: { status?: string }) => (r as Record<string, unknown>).status === "verified",
        ).length,
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
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("insurance_evidence")
      .insert({
        organization_id: req.body.organizationId,
        evidence_type: req.body.evidenceType ?? "document",
        title: req.body.title,
        description: req.body.description ?? null,
        file_url: req.body.fileUrl ?? null,
        status: req.body.status ?? "pending",
        coverage_area: req.body.coverageArea ?? null,
        insurance_provider: req.body.insuranceProvider ?? null,
        policy_number: req.body.policyNumber ?? null,
        expiry_date: req.body.expiryDate ?? null,
        created_by: req.authUser!.userId,
      })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      organizationId: req.body.organizationId,
      actorUserId: req.authUser!.userId,
      action: "insurance.evidence.created",
      entityType: "insurance_evidence",
      entityId: data.id,
      metadata: { title: req.body.title },
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
    const supabase = getSupabaseAdmin();
    const updateData: Record<string, unknown> = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.fileUrl !== undefined) updateData.file_url = req.body.fileUrl;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.coverageArea !== undefined) updateData.coverage_area = req.body.coverageArea;
    if (req.body.insuranceProvider !== undefined)
      updateData.insurance_provider = req.body.insuranceProvider;
    if (req.body.policyNumber !== undefined) updateData.policy_number = req.body.policyNumber;
    if (req.body.expiryDate !== undefined) updateData.expiry_date = req.body.expiryDate;
    if (req.body.evidenceType !== undefined) updateData.evidence_type = req.body.evidenceType;

    if (req.body.status === "verified" && !updateData.last_verified_at) {
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
