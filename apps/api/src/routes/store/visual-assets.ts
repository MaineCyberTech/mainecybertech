import { Router } from "express";
import { z, ZodError } from "zod";
import { getSupabaseAdmin } from "../../services/supabase";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/admin";
import { AppError, success, failure } from "../../types";
import { logAuditEvent } from "../../services/audit";
import { type UpdateRow } from "../../lib/db-types";
import { LIST_HARD_CAP } from "../../lib/pagination";

/** Store visual assets (admin CRUD). Extracted from `routes/store.ts` (same pattern as `routes/final/`). */
export function registerVisualAssetRoutes(router: Router) {
  const visualAssetSchema = z.object({
    linkedEntityType: z.string().min(1).max(100),
    linkedEntityId: z.string().min(1).max(200),
    assetType: z.string().min(1).max(100),
    iconName: z.string().max(100).default(""),
    accentColor: z.string().max(50).default(""),
    imageUrl: z.string().max(2000).default(""),
    altText: z.string().max(500).default(""),
    decorative: z.boolean().default(false),
    provenance: z.string().max(500).default(""),
    licenseNotes: z.string().max(1000).default(""),
  });

  const updateVisualAssetSchema = visualAssetSchema.partial();

  // --- Visual assets (admin) ---
  interface VisualAssetRow {
    id: string;
    linked_entity_type: string;
    linked_entity_id: string;
    asset_type: string;
    icon_name: string | null;
    accent_color: string | null;
    image_url: string | null;
    alt_text: string | null;
    decorative: boolean | null;
    provenance: string | null;
    license_notes: string | null;
    created_at: string;
    updated_at: string;
  }

  function rowToVisualAsset(row: VisualAssetRow) {
    return {
      id: row.id,
      linkedEntityType: row.linked_entity_type,
      linkedEntityId: row.linked_entity_id,
      assetType: row.asset_type,
      iconName: row.icon_name ?? "",
      accentColor: row.accent_color ?? "",
      imageUrl: row.image_url ?? "",
      altText: row.alt_text ?? "",
      decorative: row.decorative ?? false,
      provenance: row.provenance ?? "",
      licenseNotes: row.license_notes ?? "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // GET /api/v1/store/visual-assets - list visual assets (admin)
  router.get("/visual-assets", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      let query = supabase.from("store_visual_assets").select("*");
      if (req.query.linkedEntityType) {
        query = query.eq("linked_entity_type", String(req.query.linkedEntityType));
      }
      if (req.query.linkedEntityId) {
        query = query.eq("linked_entity_id", String(req.query.linkedEntityId));
      }
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(LIST_HARD_CAP);

      if (error) throw new AppError("DB_ERROR", error.message, 500);
      res.json(success(((data ?? []) as VisualAssetRow[]).map(rowToVisualAsset)));
    } catch (error) {
      next(error);
    }
  });

  // POST /api/v1/store/visual-assets - create a visual asset (admin)
  router.post("/visual-assets", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const parsed = visualAssetSchema.parse(req.body);
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("store_visual_assets")
        .insert({
          linked_entity_type: parsed.linkedEntityType,
          linked_entity_id: parsed.linkedEntityId,
          asset_type: parsed.assetType,
          icon_name: parsed.iconName,
          accent_color: parsed.accentColor,
          image_url: parsed.imageUrl,
          alt_text: parsed.altText,
          decorative: parsed.decorative,
          provenance: parsed.provenance,
          license_notes: parsed.licenseNotes,
        })
        .select()
        .single();

      if (error) throw new AppError("DB_ERROR", error.message, 500);

      await logAuditEvent({
        actorUserId: req.authUser?.userId ?? null,
        action: "store.visual_asset.create",
        entityType: "store_visual_asset",
        entityId: data.id,
        metadata: {
          linkedEntityType: parsed.linkedEntityType,
          linkedEntityId: parsed.linkedEntityId,
        },
      });

      res.status(201).json(success(rowToVisualAsset(data as VisualAssetRow)));
    } catch (error) {
      if (error instanceof ZodError) {
        res
          .status(400)
          .json(failure("VALIDATION", "Validation failed", 400, { issues: error.issues }));
        return;
      }
      next(error);
    }
  });

  // PATCH /api/v1/store/visual-assets/:id - update a visual asset (admin)
  router.patch("/visual-assets/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const parsed = updateVisualAssetSchema.parse(req.body);
      const supabase = getSupabaseAdmin();

      const update: Record<string, unknown> = {};
      if (parsed.linkedEntityType !== undefined)
        update.linked_entity_type = parsed.linkedEntityType;
      if (parsed.linkedEntityId !== undefined) update.linked_entity_id = parsed.linkedEntityId;
      if (parsed.assetType !== undefined) update.asset_type = parsed.assetType;
      if (parsed.iconName !== undefined) update.icon_name = parsed.iconName;
      if (parsed.accentColor !== undefined) update.accent_color = parsed.accentColor;
      if (parsed.imageUrl !== undefined) update.image_url = parsed.imageUrl;
      if (parsed.altText !== undefined) update.alt_text = parsed.altText;
      if (parsed.decorative !== undefined) update.decorative = parsed.decorative;
      if (parsed.provenance !== undefined) update.provenance = parsed.provenance;
      if (parsed.licenseNotes !== undefined) update.license_notes = parsed.licenseNotes;
      if (Object.keys(update).length === 0) {
        throw new AppError("VALIDATION", "No updatable fields provided", 400);
      }

      const { data, error } = await supabase
        .from("store_visual_assets")
        .update(update as UpdateRow<"store_visual_assets">)
        .eq("id", String(req.params.id))
        .select()
        .maybeSingle();

      if (error) throw new AppError("DB_ERROR", error.message, 500);
      if (!data) throw new AppError("NOT_FOUND", "Visual asset not found", 404);

      await logAuditEvent({
        actorUserId: req.authUser?.userId ?? null,
        action: "store.visual_asset.update",
        entityType: "store_visual_asset",
        entityId: data.id,
        metadata: { fields: Object.keys(update) },
      });

      res.json(success(rowToVisualAsset(data as VisualAssetRow)));
    } catch (error) {
      if (error instanceof ZodError) {
        res
          .status(400)
          .json(failure("VALIDATION", "Validation failed", 400, { issues: error.issues }));
        return;
      }
      next(error);
    }
  });

  // DELETE /api/v1/store/visual-assets/:id - delete a visual asset (admin)
  router.delete("/visual-assets/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from("store_visual_assets")
        .delete()
        .eq("id", String(req.params.id));

      if (error) throw new AppError("DB_ERROR", error.message, 500);

      await logAuditEvent({
        actorUserId: req.authUser?.userId ?? null,
        action: "store.visual_asset.delete",
        entityType: "store_visual_asset",
        entityId: String(req.params.id),
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
}
