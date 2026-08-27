import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { AppError, success, failure } from "../types";
import { logAuditEvent } from "../services/audit";
import { ZodError } from "zod";
import { getProducts, getCategories, getProductBySlug, getCategoryBySlug, getProductsByCategory } from "../lib/store-catalog";

const router: ReturnType<typeof Router> = Router();

const createPromotionSchema = z.object({
  name: z.string().min(1).max(200),
  badgeText: z.string().max(200).default(""),
  detailText: z.string().max(2000).default(""),
  promoType: z.string().default("bundle_savings"),
  status: z.enum(["active", "paused", "expired", "archived"]).default("paused"),
  terms: z.string().max(5000).default(""),
  eligibilityTargets: z.array(z.string()).default([]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const updatePromotionSchema = createPromotionSchema.partial();

const quoteItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().optional(),
  priceRange: z.string().optional(),
});

const createQuoteSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(50).optional(),
  notes: z.string().max(5000).default(""),
  items: z.array(z.union([z.string(), quoteItemSchema])).default([]),
});

// GET /api/v1/store/promotions - list active promotions (public)
router.get("/promotions", async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_promotions")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/store/promotions/active alias (public)
router.get("/promotions/active", async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_promotions")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/store/promotions/admin - list all promotions (admin)
router.get("/promotions/admin", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_promotions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/store/promotions - create a promotion (admin)
router.post("/promotions", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = createPromotionSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_promotions")
      .insert({
        name: parsed.name,
        badge_text: parsed.badgeText,
        detail_text: parsed.detailText,
        promo_type: parsed.promoType,
        status: parsed.status,
        terms: parsed.terms,
        eligibility_targets: parsed.eligibilityTargets,
        start_date: parsed.startDate || null,
        end_date: parsed.endDate || null,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      action: "store.promotion.create",
      entityType: "store_promotion",
      entityId: data.id,
      metadata: { name: parsed.name },
    });

    res.status(201).json(success(data));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(failure("VALIDATION", "Validation failed", 400, { issues: error.issues }));
      return;
    }
    next(error);
  }
});

// PATCH /api/v1/store/promotions/:id - update a promotion (admin)
router.patch("/promotions/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = updatePromotionSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const updates: Record<string, unknown> = {};
    if (parsed.name !== undefined) updates.name = parsed.name;
    if (parsed.badgeText !== undefined) updates.badge_text = parsed.badgeText;
    if (parsed.detailText !== undefined) updates.detail_text = parsed.detailText;
    if (parsed.promoType !== undefined) updates.promo_type = parsed.promoType;
    if (parsed.status !== undefined) updates.status = parsed.status;
    if (parsed.terms !== undefined) updates.terms = parsed.terms;
    if (parsed.eligibilityTargets !== undefined) updates.eligibility_targets = parsed.eligibilityTargets;
    if (parsed.startDate !== undefined) updates.start_date = parsed.startDate || null;
    if (parsed.endDate !== undefined) updates.end_date = parsed.endDate || null;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("store_promotions")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Promotion not found", 404);

    res.json(success(data));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(failure("VALIDATION", "Validation failed", 400, { issues: error.issues }));
      return;
    }
    next(error);
  }
});

// DELETE /api/v1/store/promotions/:id - delete a promotion (admin)
router.delete("/promotions/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("store_promotions")
      .delete()
      .eq("id", req.params.id);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      action: "store.promotion.delete",
      entityType: "store_promotion",
      entityId: String(req.params.id) as string,
    });

    res.json(success({ deleted: true }));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/store/quotes - submit a quote (public)
router.post("/quotes", async (req, res, next) => {
  try {
    const parsed = createQuoteSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("store_quotes")
      .insert({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone || null,
        notes: parsed.notes,
        items: parsed.items,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      action: "store.quote.submit",
      entityType: "store_quote",
      entityId: data.id,
      metadata: { name: parsed.name, email: parsed.email },
    });

    res.status(201).json(success(data));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(failure("VALIDATION", "Validation failed", 400, { issues: error.issues }));
      return;
    }
    next(error);
  }
});

// GET /api/v1/store/quotes - list quotes (admin)
router.get("/quotes", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/store/products - list products (public)
router.get("/products", async (req, res, next) => {
  try {
    const category = String(req.query.category ?? "");
    const allProducts = await getProducts();
    const result = category
      ? allProducts.filter((p) => p.category === category || p.categoryId === category)
      : allProducts;
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/store/products/:slug - product detail (public)
router.get("/products/:slug", async (req, res, next) => {
  try {
    const product = await getProductBySlug(req.params.slug);
    if (!product) {
      res.status(404).json(failure("NOT_FOUND", "Product not found", 404));
      return;
    }
    res.json(success(product));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/store/categories - list categories (public)
router.get("/categories", async (req, res, next) => {
  try {
    const cats = await getCategories();
    const result = await Promise.all(
      cats.map(async (c) => ({
        ...c,
        productCount: (await getProductsByCategory(c.slug)).length,
      })),
    );
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/store/categories/:slug - category detail with products (public)
router.get("/categories/:slug", async (req, res, next) => {
  try {
    const category = await getCategoryBySlug(req.params.slug);
    if (!category) {
      res.status(404).json(failure("NOT_FOUND", "Category not found", 404));
      return;
    }
    const products = await getProductsByCategory(category.slug);
    res.json(success({ ...category, products }));
  } catch (err) {
    next(err);
  }
});

// ===== Admin CRUD for store catalog (P2-22/23) =====
// The catalog is now DB-backed (store_products / store_categories). These
// endpoints let admins manage it. Guarded by requireAdmin.
const productUpsertSchema = z.object({
  id: z.string().min(1).optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().nullable().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  display: z.boolean().optional(),
  status: z.string().optional(),
  priceRange: z.string().optional(),
  pricingModel: z.string().optional(),
  purchaseMode: z.string().optional(),
  summary: z.string().optional(),
  marketingHeadline: z.string().optional(),
  marketingCopy: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

const categoryUpsertSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  count: z.number().int().optional(),
});

// POST /api/v1/store/products - create product (admin)
router.post("/products", requireAdmin, async (req, res, next) => {
  try {
    const parsed = productUpsertSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const row = {
      id: parsed.id ?? parsed.slug,
      slug: parsed.slug,
      name: parsed.name,
      category_id: parsed.categoryId ?? null,
      category: parsed.category ?? "",
      type: parsed.type ?? "service",
      display: parsed.display ?? true,
      status: parsed.status ?? "draft",
      price_range: parsed.priceRange ?? "",
      pricing_model: parsed.pricingModel ?? "",
      purchase_mode: parsed.purchaseMode ?? "",
      summary: parsed.summary ?? "",
      marketing_headline: parsed.marketingHeadline ?? "",
      marketing_copy: parsed.marketingCopy ?? "",
      tags: parsed.tags ?? [],
      attributes: parsed.attributes ?? {},
    };
    const { data, error } = await supabase
      .from("store_products")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser?.userId,
      action: "store_product.create",
      entityType: "store_product",
      entityId: data.id,
      metadata: { slug: parsed.slug },
    });
    res.status(201).json(success(data));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(failure("VALIDATION", error.message, 400));
      return;
    }
    next(error);
  }
});

// PATCH /api/v1/store/products/:id - update product (admin)
router.patch("/products/:id", requireAdmin, async (req, res, next) => {
  try {
    const parsed = productUpsertSchema.partial().parse(req.body);
    const supabase = getSupabaseAdmin();
    const existing = await supabase
      .from("store_products")
      .select("id")
      .eq("id", req.params.id)
      .maybeSingle();
    if (!existing.data) {
      res.status(404).json(failure("NOT_FOUND", "Product not found", 404));
      return;
    }
    const row: Record<string, unknown> = {};
    if (parsed.slug !== undefined) row.slug = parsed.slug;
    if (parsed.name !== undefined) row.name = parsed.name;
    if (parsed.categoryId !== undefined) row.category_id = parsed.categoryId;
    if (parsed.category !== undefined) row.category = parsed.category;
    if (parsed.type !== undefined) row.type = parsed.type;
    if (parsed.display !== undefined) row.display = parsed.display;
    if (parsed.status !== undefined) row.status = parsed.status;
    if (parsed.priceRange !== undefined) row.price_range = parsed.priceRange;
    if (parsed.pricingModel !== undefined) row.pricing_model = parsed.pricingModel;
    if (parsed.purchaseMode !== undefined) row.purchase_mode = parsed.purchaseMode;
    if (parsed.summary !== undefined) row.summary = parsed.summary;
    if (parsed.marketingHeadline !== undefined) row.marketing_headline = parsed.marketingHeadline;
    if (parsed.marketingCopy !== undefined) row.marketing_copy = parsed.marketingCopy;
    if (parsed.tags !== undefined) row.tags = parsed.tags;
    if (parsed.attributes !== undefined) row.attributes = parsed.attributes;
    const { data, error } = await supabase
      .from("store_products")
      .update(row)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser?.userId,
      action: "store_product.update",
      entityType: "store_product",
      entityId: String(req.params.id),
    });
    res.json(success(data));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(failure("VALIDATION", error.message, 400));
      return;
    }
    next(error);
  }
});

// DELETE /api/v1/store/products/:id - delete product (admin)
router.delete("/products/:id", requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("store_products").delete().eq("id", req.params.id);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser?.userId,
      action: "store_product.delete",
      entityType: "store_product",
      entityId: String(req.params.id),
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/store/categories - create category (admin)
router.post("/categories", requireAdmin, async (req, res, next) => {
  try {
    const parsed = categoryUpsertSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const row = {
      id: parsed.id ?? parsed.slug,
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description ?? "",
      product_ids: parsed.productIds ?? [],
      count: parsed.count ?? (parsed.productIds ? parsed.productIds.length : 0),
    };
    const { data, error } = await supabase
      .from("store_categories")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser?.userId,
      action: "store_category.create",
      entityType: "store_category",
      entityId: data.id,
      metadata: { slug: parsed.slug },
    });
    res.status(201).json(success(data));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(failure("VALIDATION", error.message, 400));
      return;
    }
    next(error);
  }
});

// PATCH /api/v1/store/categories/:id - update category (admin)
router.patch("/categories/:id", requireAdmin, async (req, res, next) => {
  try {
    const parsed = categoryUpsertSchema.partial().parse(req.body);
    const supabase = getSupabaseAdmin();
    const existing = await supabase
      .from("store_categories")
      .select("id")
      .eq("id", req.params.id)
      .maybeSingle();
    if (!existing.data) {
      res.status(404).json(failure("NOT_FOUND", "Category not found", 404));
      return;
    }
    const row: Record<string, unknown> = {};
    if (parsed.name !== undefined) row.name = parsed.name;
    if (parsed.slug !== undefined) row.slug = parsed.slug;
    if (parsed.description !== undefined) row.description = parsed.description;
    if (parsed.productIds !== undefined) row.product_ids = parsed.productIds;
    if (parsed.count !== undefined) row.count = parsed.count;
    const { data, error } = await supabase
      .from("store_categories")
      .update(row)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser?.userId,
      action: "store_category.update",
      entityType: "store_category",
      entityId: String(req.params.id),
    });
    res.json(success(data));
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(failure("VALIDATION", error.message, 400));
      return;
    }
    next(error);
  }
});

// DELETE /api/v1/store/categories/:id - delete category (admin)
router.delete("/categories/:id", requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("store_categories").delete().eq("id", req.params.id);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser?.userId,
      action: "store_category.delete",
      entityType: "store_category",
      entityId: String(req.params.id),
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
