import { Router } from "express";
import { z } from "zod";
import { getScopedClient } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requirePermission } from "../middleware/permissions";
import { loadOwned } from "../lib/tenant";
import { updateMembershipSchema } from "../validators/membership";
import { assertCanAssignRole, resolveRoleKey } from "../lib/role-assignment";
import { dispatchWebhook } from "../lib/webhook-dispatcher";
import { clearPermissionCache } from "../lib/permissions";
import { assertDeleteConfirmed } from "../lib/delete-confirm";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

router.get("/", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "memberships", "read");

    const orgId = req.query.organization_id as string | undefined;
    const statusFilter = req.query.status as string | undefined;
    const userId = req.query.user_id as string | undefined;

    let query = supabase.from("memberships").select("*, organizations(*), roles(*)");

    // When the caller enumerates their OWN memberships (user_id = self),
    // do not scope to the active org — they need the full list to resolve
    // the active org and detect platform-admin access. Cross-user lookups
    // keep the org filter (caller's active org) for tenant isolation.
    const isSelfLookup = userId != null && userId === req.authUser?.userId;
    if (orgId && !isSelfLookup) query = query.eq("organization_id", orgId);
    if (statusFilter) query = query.eq("status", statusFilter as never);
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
    const supabase = getScopedClient(req, "memberships", "read");
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

router.post("/invite", requirePermission("users", "manage"), async (req, res, next) => {
  try {
    const { organizationId, email, roleId } = z
      .object({
        organizationId: z.string().min(1),
        email: z.string().email(),
        roleId: z.string().min(1),
      })
      .parse(req.body);

    const supabase = getScopedClient(req, "memberships", "write");

    const { data: userByEmail } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!userByEmail) {
      throw new AppError("NOT_FOUND", `No user found with email ${email}`, 404);
    }

    // SEC-P1-001: the role must exist and the caller may only grant it when
    // allowed (cross-tenant roles require a platform super admin).
    const inviteRoleKey = await resolveRoleKey(supabase, roleId);
    await assertCanAssignRole(supabase, req.authUser!.userId, inviteRoleKey, userByEmail.id);

    const { data: existing } = await supabase
      .from("memberships")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", userByEmail.id)
      .maybeSingle();

    if (existing) {
      throw new AppError("CONFLICT", "User already has a membership in this organization", 409);
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

    // EVOL-P2-002: catalogued outbound event for membership creation.
    dispatchWebhook("membership.created", organizationId, {
      membershipId: data.id,
      userId: userByEmail.id,
      roleId,
      status: data.status,
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requirePermission("users", "manage"), async (req, res, next) => {
  try {
    const parsed = updateMembershipSchema.parse(req.body);
    const supabase = getScopedClient(req, "memberships", "write");
    const membership = await loadOwned(req, supabase, "memberships", String(req.params.id));

    // SEC-P1-001 / ADMIN-P1-003: validate the new role and guard the
    // assignment; also require a super admin to touch a membership that
    // currently holds a cross-tenant role. `roleId` is optional (USE-P1-003
    // status-only transitions), so only guard when it is being changed.
    if (parsed.roleId) {
      const nextRoleKey = await resolveRoleKey(supabase, parsed.roleId);
      await assertCanAssignRole(
        supabase,
        req.authUser!.userId,
        nextRoleKey,
        membership.user_id as string,
      );
    }
    if (membership.role_id) {
      const currentRoleKey = await resolveRoleKey(supabase, membership.role_id as string);
      await assertCanAssignRole(supabase, req.authUser!.userId, currentRoleKey);
    }

    // Only touch fields the caller actually sent so a status-only transition
    // (approve/reject from the admin queue) cannot clear the role or the
    // billing/security contact flags.
    const { data, error } = await supabase
      .from("memberships")
      .update({
        status: parsed.status,
        ...(parsed.roleId !== undefined ? { role_id: parsed.roleId } : {}),
        ...(parsed.isBillingContact !== undefined
          ? { is_billing_contact: parsed.isBillingContact }
          : {}),
        ...(parsed.isSecurityContact !== undefined
          ? { is_security_contact: parsed.isSecurityContact }
          : {}),
      })
      .eq("id", String(req.params.id))
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Membership not found", 404);

    // PERF-P2-003: status/role changes alter the member's effective grants.
    clearPermissionCache(membership.user_id as string);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "membership.update",
      entityType: "membership",
      entityId: data.id,
      metadata: parsed,
    });

    // EVOL-P2-002: catalogued outbound event for membership state changes
    // (approve/reject, role change, contact flags).
    dispatchWebhook("membership.updated", data.organization_id, {
      membershipId: data.id,
      userId: data.user_id,
      status: data.status,
      changed: Object.keys(parsed),
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requirePermission("users", "manage"), async (req, res, next) => {
  try {
    assertDeleteConfirmed(req.body);
    const supabase = getScopedClient(req, "memberships", "write");
    const membership = await loadOwned(req, supabase, "memberships", String(req.params.id));
    const { error } = await supabase.from("memberships").delete().eq("id", String(req.params.id));

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    // PERF-P2-003: the removed member's grants must not be served from cache.
    clearPermissionCache(membership.user_id as string);

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
