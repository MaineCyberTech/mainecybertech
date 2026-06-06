import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

const updateProfileSchema = z.object({
  fullName: z.string().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  title: z.string().max(255).optional().nullable(),
});

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const ids = req.query.ids as string | undefined;
    const email = req.query.email as string | undefined;
    let query = supabase.from("profiles").select("*");

    if (ids) {
      const idsArr = ids.split(",").map((s) => s.trim()).filter(Boolean);
      if (idsArr.length > 0) {
        query = query.in("id", idsArr);
      }
    }

    if (email) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email.toLowerCase())
        .maybeSingle();
      if (profileError) throw new AppError("DB_ERROR", profileError.message, 500);
      res.json(success(profile ?? null));
      return;
    }

    const { data, error } = await query;

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !data)
      throw new AppError("NOT_FOUND", "Profile not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = updateProfileSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const updateData: Record<string, unknown> = {};
    if (parsed.fullName !== undefined) updateData.full_name = parsed.fullName;
    if (parsed.phone !== undefined) updateData.phone = parsed.phone;
    if (parsed.title !== undefined) updateData.title = parsed.title;

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Profile not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser?.userId,
      action: "profile.update",
      entityType: "profile",
      entityId: req.params.id,
      metadata: updateData,
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/avatar", upload.single("avatar"), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) throw new AppError("VALIDATION", "Avatar file is required", 400);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError("VALIDATION", "Avatar must be a JPEG, PNG, WebP, or GIF image", 400);
    }

    const ext = file.originalname.split(".").pop() ?? "png";
    const userId = req.params.id as string;
    const storagePath = `${userId}/avatar.${ext}`;
    const supabase = getSupabaseAdmin();

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) throw new AppError("STORAGE_ERROR", uploadError.message, 500);

    const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(storagePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl.publicUrl })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) throw new AppError("DB_ERROR", updateError.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser?.userId,
      action: "profile.update",
      entityType: "profile",
      entityId: userId,
      metadata: { avatar: true },
    });

    res.json(success({ avatarUrl: publicUrl.publicUrl }));
  } catch (error) {
    next(error);
  }
});

export default router;
