import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requireAdmin } from "../middleware/admin";
import { updateMembershipSchema } from "../validators/membership";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

router.get("/", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    const orgId = req.query.organization_id as string | undefined;
    const statusFilter = req.query.status as string | undefined;
    const userId = req.query.user_id as string | undefined;

    let query = supabase
      .from("memberships")
      .select("*, organizations(*), roles(*)");

    if (orgId) query = query.eq("organization_id", orgId);
    if (statusFilter) query = query.eq("status", statusFilter);
    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/mine", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const query = supabase
      .from("memberships")
      .select("*, organizations(*), roles(*)")
      .eq("user_id", req.authUser!.userId);

    const { data, error } = await query;

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/invite", requireAdmin, async (req, res, next) => {
  try {
    const { organizationId, email, roleId } = z
      .object({
        organizationId: z.string().min(1),
        email: z.string().email(),
        roleId: z.string().min(1),
      })
      .parse(req.body);

    const supabase = getSupabaseAdmin();

    const { data: userByEmail } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!userByEmail) {
      throw new AppError("NOT_FOUND", `No user found with email ${email}`, 404);
    }

    const { data: existing } = await supabase
      .from("memberships")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", userByEmail.id)
      .maybeSingle();

    if (existing) {
      throw new AppError(
        "CONFLICT",
        "User already has a membership in this organization",
        409,
      );
    }

    const { data, error } = await supabase
      .from("memberships")
      .insert({
        organization_id: organizationId,
        user_id: userByEmail.id,
        role_id: roleId,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      organizationId,
      action: "membership.invite",
      entityType: "membership",
      entityId: data.id,
      metadata: { email, roleId },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateMembershipSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("memberships")
      .update({
        role_id: parsed.roleId,
        status: parsed.status,
        is_billing_contact: parsed.isBillingContact,
        is_security_contact: parsed.isSecurityContact,
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Membership not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "membership.update",
      entityType: "membership",
      entityId: data.id,
      metadata: parsed,
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("memberships")
      .delete()
      .eq("id", req.params.id);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "membership.remove",
      entityType: "membership",
      entityId: String(req.params.id),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
