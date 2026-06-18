import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { AppError, success } from "../types";
import { logAuditEvent } from "../services/audit";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

const MODULES = [
  "tickets",
  "projects",
  "documents",
  "billing",
  "system",
] as const;
const CHANNELS = ["email", "sms", "in_app"] as const;

router.get("/", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string | undefined;

    let query = supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", req.authUser!.userId);

    if (orgId) query = query.eq("organization_id", orgId);

    const { data, error } = await query;
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    res.json(
      success({
        preferences: data ?? [],
        modules: [...MODULES],
        channels: [...CHANNELS],
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const { organizationId, preferences } = z
      .object({
        organizationId: z.string().optional(),
        preferences: z
          .array(
            z.object({
              moduleKey: z.enum(MODULES),
              channel: z.enum(CHANNELS),
              enabled: z.boolean(),
            }),
          )
          .min(1),
      })
      .parse(req.body);

    const supabase = getSupabaseAdmin();

    const results = [];
    for (const pref of preferences) {
      const { data, error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            organization_id: organizationId ?? null,
            user_id: req.authUser!.userId,
            module_key: pref.moduleKey,
            channel: pref.channel,
            enabled: pref.enabled,
          },
          { onConflict: "organization_id,user_id,module_key,channel" },
        )
        .select()
        .single();

      if (error) throw new AppError("DB_ERROR", error.message, 500);
      results.push(data);
    }

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "notification_preference.update",
      entityType: "notification_preference",
      metadata: { organizationId, preferenceCount: preferences.length },
    });

    res.json(success(results));
  } catch (error) {
    next(error);
  }
});

export default router;
