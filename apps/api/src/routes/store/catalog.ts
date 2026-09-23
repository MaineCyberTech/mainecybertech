import { Router } from "express";
import { z, ZodError } from "zod";
import { getSupabaseAdmin } from "../../services/supabase";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/admin";
import { AppError, success, failure } from "../../types";
import { logAuditEvent } from "../../services/audit";
import {
  getProducts,
  getCategories,
  getProductBySlug,
  getCategoryBySlug,
  getProductsByCategory,
} from "../../lib/store-catalog";
import { toJson, type UpdateRow } from "../../lib/db-types";

/** Store catalog: product/category reads (public) + admin CRUD. Extracted from `routes/store.ts` (same pattern as `routes/final/`). */
export function registerCatalogRoutes(router: Router) {
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

  // GET /api/v1/store/products/by-id/:id - product by id (admin)
  router.get("/products/by-id/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const allProducts = await getProducts();
      const product = allProducts.find((p) => p.id === String(req.params.id));
      if (!product) {
        res.status(404).json(failure("NOT_FOUND", "Product not found", 404));
        return;
      }
      res.json(success(product));
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/store/products/:slug - product detail (public)
  router.get("/products/:slug", async (req, res, next) => {
    try {
      const product = await getProductBySlug(String(req.params.slug));
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
      // Fetch both collections once and count in memory (previously this was an
      // N+1: one full product read per category).
      const [cats, allProducts] = await Promise.all([getCategories(), getProducts()]);
      const result = cats.map((c) => ({
        ...c,
        productCount: allProducts.filter(
          (p) => p.categoryId === c.id || p.categoryId === c.slug || p.category === c.slug,
        ).length,
      }));
      res.json(success(result));
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/store/categories/:slug - category detail with products (public)
  router.get("/categories/:slug", async (req, res, next) => {
    try {
      const category = await getCategoryBySlug(String(req.params.slug));
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
  router.post("/products", requireAuth, requireAdmin, async (req, res, next) => {
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
        attributes: toJson(parsed.attributes ?? {}),
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
  router.patch("/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const parsed = productUpsertSchema.partial().parse(req.body);
      const supabase = getSupabaseAdmin();
      const existing = await supabase
        .from("store_products")
        .select("id")
        .eq("id", String(req.params.id))
        .maybeSingle();
      if (!existing.data) {
        res.status(404).json(failure("NOT_FOUND", "Product not found", 404));
        return;
      }
      const row: UpdateRow<"store_products"> = {};
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
      if (parsed.attributes !== undefined) row.attributes = toJson(parsed.attributes);
      const { data, error } = await supabase
        .from("store_products")
        .update(row)
        .eq("id", String(req.params.id))
        .select()
        .single();
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      await logAuditEvent({
        actorUserId: req.authUser?.userId,
        action: "store_product.update",
        entityType: "store_product",
        entityId: String(String(req.params.id)),
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
  router.delete("/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from("store_products")
        .delete()
        .eq("id", String(req.params.id));
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      await logAuditEvent({
        actorUserId: req.authUser?.userId,
        action: "store_product.delete",
        entityType: "store_product",
        entityId: String(String(req.params.id)),
      });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // POST /api/v1/store/categories - create category (admin)
  router.post("/categories", requireAuth, requireAdmin, async (req, res, next) => {
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
  router.patch("/categories/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const parsed = categoryUpsertSchema.partial().parse(req.body);
      const supabase = getSupabaseAdmin();
      const existing = await supabase
        .from("store_categories")
        .select("id")
        .eq("id", String(req.params.id))
        .maybeSingle();
      if (!existing.data) {
        res.status(404).json(failure("NOT_FOUND", "Category not found", 404));
        return;
      }
      const row: UpdateRow<"store_categories"> = {};
      if (parsed.name !== undefined) row.name = parsed.name;
      if (parsed.slug !== undefined) row.slug = parsed.slug;
      if (parsed.description !== undefined) row.description = parsed.description;
      if (parsed.productIds !== undefined) row.product_ids = parsed.productIds;
      if (parsed.count !== undefined) row.count = parsed.count;
      const { data, error } = await supabase
        .from("store_categories")
        .update(row)
        .eq("id", String(req.params.id))
        .select()
        .single();
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      await logAuditEvent({
        actorUserId: req.authUser?.userId,
        action: "store_category.update",
        entityType: "store_category",
        entityId: String(String(req.params.id)),
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
  router.delete("/categories/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from("store_categories")
        .delete()
        .eq("id", String(req.params.id));
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      await logAuditEvent({
        actorUserId: req.authUser?.userId,
        action: "store_category.delete",
        entityType: "store_category",
        entityId: String(String(req.params.id)),
      });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
}
