import { Router } from "express";
import { getScopedClient } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { loadOwned } from "../lib/tenant";
import {
  createNetworkDiagramSchema,
  updateNetworkDiagramSchema,
} from "../validators/network-diagrams";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

router.get("/", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "network-diagrams", "read");
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    let query = supabase.from("network_diagrams").select("*", { count: "exact" });

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const search = req.query.search as string | undefined;
    if (search) query = query.ilike("name", `%${search}%`);

    const {
      data,
      error,
      count,
    } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const result: PaginatedResult<unknown> = {
      items: data ?? [],
      total: count ?? 0,
      page,
      limit,
    };

    res.json(success(result));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "network-diagrams", "read");
    let query = supabase.from("network_diagrams").select("*").eq("id", String(req.params.id as string));

    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);

    const { data, error } = await query.single();
    if (error || !data) throw new AppError("NOT_FOUND", "Network diagram not found", 404);

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createNetworkDiagramSchema.parse(req.body);
    const supabase = getScopedClient(req, "network-diagrams", "write");

    const { data, error } = await supabase
      .from("network_diagrams")
      .insert({
        organization_id: parsed.organizationId,
        name: parsed.name,
        description: parsed.description ?? null,
        diagram: parsed.diagram ?? { nodes: [], edges: [] },
        created_by: req.authUser!.userId,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "network_diagram.created",
      entityType: "network_diagram",
      entityId: data.id,
      metadata: { name: parsed.name },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = updateNetworkDiagramSchema.parse(req.body);
    const supabase = getScopedClient(req, "network-diagrams", "write");
    await loadOwned(req, supabase as any, "network_diagrams", String(req.params.id as string));

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.diagram !== undefined) updateData.diagram = parsed.diagram;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("network_diagrams")
      .update(updateData)
      .eq("id", String(req.params.id as string))
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Network diagram not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "network_diagram.updated",
      entityType: "network_diagram",
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
    const supabase = getScopedClient(req, "network-diagrams", "write");
    await loadOwned(req, supabase as any, "network_diagrams", String(req.params.id as string));
    const { error } = await supabase.from("network_diagrams").delete().eq("id", String(req.params.id as string));

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "network_diagram.deleted",
      entityType: "network_diagram",
      entityId: String(String(req.params.id as string)),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
