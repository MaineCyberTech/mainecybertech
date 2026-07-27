import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";

const router = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

const createSchema = z.object({
  organizationId: z.string().min(1),
  softwareName: z.string().min(1).max(200),
  licenseType: z.string().default("per_seat"),
  totalSeats: z.number().int().min(1),
  usedSeats: z.number().int().min(0).default(0),
  costPerSeat: z.number().min(0).optional().nullable(),
  billingCycle: z.string().default("monthly"),
  notes: z.string().max(2000).optional().nullable(),
});

const updateSchema = createSchema.partial();

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
    let q = supabase
      .from("license_allocations")
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

// Get single
router.get("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("license_allocations")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "License not found", 404);
    res.json(success(data));
  } catch (err) {
    next(err);
  }
});

// Create
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
    const { data, error } = await supabase
      .from("license_allocations")
      .insert(fields)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "license.created",
      entityType: "license",
      entityId: data.id,
    });
    res.status(201).json(success(data));
  } catch (err) {
    next(err);
  }
});

// Update
router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = updateSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v !== undefined) fields[snakeCase(k)] = v;
    }
    const { data, error } = await supabase
      .from("license_allocations")
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

// Delete
router.delete("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("license_allocations").delete().eq("id", req.params.id);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Reclaimable
router.get("/reclaimable/license-list", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("license_allocations")
      .select("*")
      .eq("organization_id", req.query.organization_id as string)
      .eq("status", "active");
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    const reclaimable = (data ?? []).filter((l: any) => l.used_seats < l.total_seats * 0.7);
    const totalSavings = reclaimable.reduce(
      (sum: number, l: any) => sum + (l.total_seats - l.used_seats) * (l.cost_per_seat || 0),
      0,
    );
    res.json(success({ reclaimable, potentialSavings: Math.round(totalSavings * 100) / 100 }));
  } catch (err) {
    next(err);
  }
});

// Summary
router.get("/summary/data", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("license_allocations")
      .select("*")
      .eq("organization_id", req.query.organization_id as string);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    const items = data ?? [];
    const totalLicenses = items.length;
    const totalCost = items.reduce(
      (sum: number, l: any) => sum + l.total_seats * (l.cost_per_seat || 0),
      0,
    );
    const avgUtilization =
      items.length > 0
        ? Math.round(
            items.reduce(
              (sum: number, l: any) =>
                sum + (l.total_seats > 0 ? (l.used_seats / l.total_seats) * 100 : 0),
              0,
            ) / items.length,
          )
        : 0;
    const potentialSavings = items.reduce(
      (sum: number, l: any) =>
        sum +
        (l.used_seats < l.total_seats * 0.7
          ? (l.total_seats - l.used_seats) * (l.cost_per_seat || 0)
          : 0),
      0,
    );
    res.json(
      success({
        totalLicenses,
        totalCost: Math.round(totalCost * 100) / 100,
        avgUtilization,
        potentialSavings: Math.round(potentialSavings * 100) / 100,
      }),
    );
  } catch (err) {
    next(err);
  }
});

export default router;
