import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { addTimelineEvent } from "../services/approvals";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requireIfMatch, checkVersionMatch } from "../middleware/optimistic-locking";
import { sendExportResponse, CsvColumn } from "../lib/csv";
import { createAssetSchema, updateAssetSchema } from "../validators/assets";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

const exportColumns: CsvColumn[] = [
  { key: "id" },
  { key: "organization_id" },
  { key: "name" },
  { key: "asset_type" },
  { key: "make" },
  { key: "model" },
  { key: "serial_number" },
  { key: "asset_tag" },
  { key: "status" },
  { key: "location" },
  { key: "purchase_date" },
  { key: "warranty_expires" },
  { key: "replacement_recommended" },
  { key: "created_at" },
];

router.get("/export", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("assets").select("*");
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);
    const { data, error } = await query.order("created_at", { ascending: false }).limit(10000);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "asset.export",
      entityType: "asset",
    });
    sendExportResponse(res, data ?? [], exportColumns, "assets");
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

    let query = supabase.from("assets").select("*", { count: "exact" });
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);
    const status = req.query.status as string | undefined;
    if (status) query = query.eq("status", status);
    const assetType = req.query.asset_type as string | undefined;
    if (assetType) query = query.eq("asset_type", assetType);
    const search = req.query.search as string | undefined;
    if (search) query = query.ilike("name", `%${search}%`);
    const warrantyBefore = req.query.warranty_expiring_before as string | undefined;
    if (warrantyBefore)
      query = query.lte("warranty_expires", warrantyBefore).neq("warranty_expires", null as any);

    const { data, error, count } = await query
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

router.get("/stats", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("assets").select("status, warranty_expires, asset_type");
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);
    const { data, error } = await query;
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const items = data ?? [];
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let expiringWarranty = 0;
    const now = new Date();
    const ninetyDays = new Date(now.getTime() + 90 * 86400000);

    for (const a of items) {
      const s = (a as { status: string }).status;
      byStatus[s] = (byStatus[s] ?? 0) + 1;
      const t = (a as { asset_type: string }).asset_type;
      byType[t] = (byType[t] ?? 0) + 1;
      const we = (a as { warranty_expires: string | null }).warranty_expires;
      if (we) {
        const d = new Date(we);
        if (d <= ninetyDays) expiringWarranty++;
      }
    }

    res.json(success({ byStatus, byType, expiringWarranty, total: items.length }));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const orgId = req.query.organization_id as string;
    if (!orgId) throw new AppError("VALIDATION", "organization_id is required", 400);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("id", req.params.id)
      .eq("organization_id", orgId)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "Asset not found", 404);

    const [{ data: comments }, { data: timeline }] = await Promise.all([
      supabase
        .from("module_comments")
        .select("*")
        .eq("module_key", "assets")
        .eq("entity_type", "asset")
        .eq("entity_id", req.params.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("module_timeline_events")
        .select("*")
        .eq("module_key", "assets")
        .eq("entity_type", "asset")
        .eq("entity_id", req.params.id)
        .order("created_at", { ascending: true }),
    ]);

    res.json(success({ ...data, comments: comments ?? [], timeline: timeline ?? [] }));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createAssetSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("assets")
      .insert({
        organization_id: parsed.organizationId,
        name: parsed.name,
        asset_type: parsed.assetType,
        make: parsed.make ?? null,
        model: parsed.model ?? null,
        serial_number: parsed.serialNumber ?? null,
        asset_tag: parsed.assetTag ?? null,
        qr_label: parsed.qrLabel ?? null,
        location: parsed.location ?? null,
        site: parsed.site ?? null,
        purchase_date: parsed.purchaseDate ?? null,
        purchase_price: parsed.purchasePrice ?? null,
        warranty_expires: parsed.warrantyExpires ?? null,
        replacement_recommended: parsed.replacementRecommended ?? null,
        lifecycle_score: parsed.lifecycleScore,
        assigned_to: parsed.assignedTo ?? null,
        maintenance_notes: parsed.maintenanceNotes ?? null,
        supported_until: parsed.supportedUntil ?? null,
        vendor_support_status: parsed.vendorSupportStatus,
        ip_address: parsed.ipAddress ?? null,
        mac_address: parsed.macAddress ?? null,
        operating_system: parsed.operatingSystem ?? null,
        contract_reference: parsed.contractReference ?? null,
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
      action: "asset.created",
      entityType: "asset",
      entityId: data.id,
      metadata: { name: parsed.name },
    });
    await addTimelineEvent(
      parsed.organizationId,
      "assets",
      "asset",
      data.id,
      "created",
      { name: parsed.name },
      req.authUser!.userId,
    );

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireIfMatch, async (req, res, next) => {
  try {
    const parsed = updateAssetSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: current, error: fetchError } = await supabase
      .from("assets")
      .select("version")
      .eq("id", req.params.id)
      .single();
    if (fetchError || !current) throw new AppError("NOT_FOUND", "Asset not found", 404);
    checkVersionMatch(current.version, req.ifMatchVersion);

    const fieldMap: Record<string, string> = {
      name: "name",
      assetType: "asset_type",
      make: "make",
      model: "model",
      serialNumber: "serial_number",
      assetTag: "asset_tag",
      qrLabel: "qr_label",
      status: "status",
      location: "location",
      site: "site",
      purchaseDate: "purchase_date",
      purchasePrice: "purchase_price",
      warrantyExpires: "warranty_expires",
      replacementRecommended: "replacement_recommended",
      lifecycleScore: "lifecycle_score",
      assignedTo: "assigned_to",
      maintenanceNotes: "maintenance_notes",
      supportedUntil: "supported_until",
      vendorSupportStatus: "vendor_support_status",
      ipAddress: "ip_address",
      macAddress: "mac_address",
      operatingSystem: "operating_system",
      contractReference: "contract_reference",
      visibility: "visibility",
      metadata: "metadata",
    };

    const updateData: Record<string, unknown> = {};
    for (const [key, col] of Object.entries(fieldMap)) {
      if ((parsed as Record<string, unknown>)[key] !== undefined)
        updateData[col] = (parsed as Record<string, unknown>)[key];
    }
    updateData.version = current.version + 1;

    const { data, error } = await supabase
      .from("assets")
      .update(updateData)
      .eq("id", req.params.id)
      .eq("version", current.version)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("VERSION_CONFLICT", "Asset was modified by another user", 409);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "asset.updated",
      entityType: "asset",
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
    const { error } = await supabase.from("assets").delete().eq("id", req.params.id);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "asset.deleted",
      entityType: "asset",
      entityId: String(req.params.id),
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/:id/comments", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("module_comments")
      .select("*")
      .eq("module_key", "assets")
      .eq("entity_type", "asset")
      .eq("entity_id", req.params.id)
      .order("created_at", { ascending: true });
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/comments", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: asset } = await supabase
      .from("assets")
      .select("organization_id")
      .eq("id", req.params.id)
      .single();
    if (!asset) throw new AppError("NOT_FOUND", "Asset not found", 404);
    const { body } = req.body as { body: string; isInternal?: boolean };
    if (!body?.trim()) throw new AppError("VALIDATION", "Comment body is required", 400);
    const { data, error } = await supabase
      .from("module_comments")
      .insert({
        organization_id: asset.organization_id,
        module_key: "assets",
        entity_type: "asset",
        entity_id: req.params.id,
        author_id: req.authUser!.userId,
        body: body.trim(),
        is_internal: (req.body as { isInternal?: boolean }).isInternal ?? false,
      })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      organizationId: asset.organization_id as string,
      actorUserId: req.authUser!.userId,
      action: "asset.comment.created",
      entityType: "asset",
      entityId: req.params.id,
    });
    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/timeline", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("module_timeline_events")
      .select("*")
      .eq("module_key", "assets")
      .eq("entity_type", "asset")
      .eq("entity_id", req.params.id)
      .order("created_at", { ascending: true });
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

export default router;
