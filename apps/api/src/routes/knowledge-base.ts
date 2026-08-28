import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { loadOwned } from "../lib/tenant";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import {
  createKnowledgeBaseSchema,
  listKnowledgeBaseQuerySchema,
  updateKnowledgeBaseSchema,
} from "../validators/knowledge-base";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

router.get("/", async (req, res, next) => {
  try {
    const { search, category } = listKnowledgeBaseQuerySchema.parse(req.query);
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    let query = supabase.from("knowledge_base_articles").select("*", { count: "exact" });
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) query = query.eq("organization_id", orgId);
    if (category) query = query.eq("category", category);
    if (search) query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);

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

router.get("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const article = await loadOwned(req, supabase as any, "knowledge_base_articles", req.params.id as string);

    res.json(success(article));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createKnowledgeBaseSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("knowledge_base_articles")
      .insert({
        organization_id: parsed.organizationId,
        title: parsed.title,
        body: parsed.body,
        category: parsed.category ?? null,
        tags: parsed.tags ?? [],
        is_published: parsed.isPublished,
        created_by: req.authUser!.userId,
      })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "knowledge_base_article.created",
      entityType: "knowledge_base_article",
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
    const parsed = updateKnowledgeBaseSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const article = await loadOwned(req, supabase as any, "knowledge_base_articles", req.params.id as string, "id, organization_id");

    const fieldMap: Record<string, string> = {
      title: "title",
      body: "body",
      category: "category",
      tags: "tags",
      isPublished: "is_published",
    };

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [key, col] of Object.entries(fieldMap)) {
      if ((parsed as Record<string, unknown>)[key] !== undefined)
        updateData[col] = (parsed as Record<string, unknown>)[key];
    }

    const { data, error } = await supabase
      .from("knowledge_base_articles")
      .update(updateData)
      .eq("id", req.params.id)
      .eq("organization_id", article.organization_id as string)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Article not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "knowledge_base_article.updated",
      entityType: "knowledge_base_article",
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
    const article = await loadOwned(req, supabase as any, "knowledge_base_articles", req.params.id as string, "id, organization_id");
    const { error } = await supabase
      .from("knowledge_base_articles")
      .delete()
      .eq("id", req.params.id)
      .eq("organization_id", article.organization_id as string);
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "knowledge_base_article.deleted",
      entityType: "knowledge_base_article",
      entityId: String(req.params.id),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
