import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { requirePermission } from "../middleware/permissions";
import {
  requireOrgAccess,
  assertOrgScopeMatches,
  assertSharesActiveOrg,
} from "../middleware/org-access";
import { queryInt } from "../lib/query";
import { roleKeyOf } from "../lib/roles";
import { setActiveUsers } from "../lib/metrics";
import { assertCanAssignRole, resolveRoleKey } from "../lib/role-assignment";
import { clearPermissionCache } from "../lib/permissions";
import { assertDeleteConfirmed } from "../lib/delete-confirm";
import { listCountMode } from "../lib/pagination";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth, requireOrgAccess);

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, queryInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, queryInt(req.query.limit, 25)));
    const offset = (page - 1) * limit;

    let orgId = req.query.organization_id as string | undefined;

    let allOrgs = false;
    if (!orgId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", req.authUser!.userId)
        .single();

      allOrgs = profile?.is_super_admin === true;
      if (!allOrgs) {
        const { data: membership } = await supabase
          .from("memberships")
          .select("organization_id")
          .eq("user_id", req.authUser!.userId)
          .eq("status", "approved")
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        if (membership) {
          orgId = membership.organization_id as string;
        }
      }
    }

    const baseQuery = supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, title, is_super_admin, default_organization_id, created_at",
        { count: listCountMode(req.query) },
      );

    let filteredQuery;
    if (orgId) {
      const { data: userIds } = await supabase
        .from("memberships")
        .select("user_id")
        .eq("organization_id", orgId)
        .eq("status", "approved");
      const ids = (userIds ?? []).map((u) => u.user_id as string);
      filteredQuery = ids.length ? baseQuery.in("id", ids) : baseQuery.in("id", ["__no_match__"]);
    } else {
      filteredQuery = baseQuery;
    }

    if (orgId) {
      const { data: membership } = await supabase
        .from("memberships")
        .select("id, roles!inner(id, key)")
        .eq("user_id", req.authUser!.userId)
        .eq("organization_id", orgId)
        .eq("status", "approved")
        .maybeSingle();

      if (!membership || !["admin", "super_admin"].includes(roleKeyOf(membership.roles) ?? "")) {
        throw new AppError(
          "FORBIDDEN",
          "You do not have access to users in this organization",
          403,
        );
      }
    }

    const finalQuery = filteredQuery.order("email").range(offset, offset + limit - 1);

    const { data, error, count } = await finalQuery;
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    setActiveUsers(count ?? 0);
    res.json(success({ items: data ?? [], total: count ?? 0, page, limit }));
  } catch (error) {
    next(error);
  }
});

// Compound endpoint: fetch all users with their related data in one query
router.get("/compound", requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    let orgId = req.query.organization_id as string | undefined;

    let allOrgs = false;
    if (!orgId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", req.authUser!.userId)
        .single();

      allOrgs = profile?.is_super_admin === true;
      if (!allOrgs) {
        const { data: membership } = await supabase
          .from("memberships")
          .select("organization_id")
          .eq("user_id", req.authUser!.userId)
          .eq("status", "approved")
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        if (membership) {
          orgId = membership.organization_id as string;
        }
      }
    }

    if (orgId) {
      const { data: membership } = await supabase
        .from("memberships")
        .select("id, roles!inner(id, key)")
        .eq("user_id", req.authUser!.userId)
        .eq("organization_id", orgId)
        .eq("status", "approved")
        .maybeSingle();

      if (!membership || !["admin", "super_admin"].includes(roleKeyOf(membership.roles) ?? "")) {
        throw new AppError(
          "FORBIDDEN",
          "You do not have access to users in this organization",
          403,
        );
      }
    }

    // Fetch all profiles scoped to the org (or all orgs for super admins)
    let profileQuery = supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, title, is_super_admin, default_organization_id, created_at",
      );

    if (orgId) {
      const { data: userIds } = await supabase
        .from("memberships")
        .select("user_id")
        .eq("organization_id", orgId)
        .eq("status", "approved");

      const ids = (userIds ?? []).map((u) => u.user_id as string);
      if (ids.length > 0) {
        profileQuery = profileQuery.in("id", ids);
      } else {
        res.json(success([]));
        return;
      }
    }

    const { data: profiles, error: profilesError } = await profileQuery.order("email");

    if (profilesError) throw new AppError("DB_ERROR", profilesError.message, 500);

    if (!profiles || profiles.length === 0) {
      res.json(success([]));
      return;
    }

    const userIds = profiles.map((p) => p.id);

    // Fetch all memberships for these users
    let memQuery = supabase
      .from("memberships")
      .select(
        "id, organization_id, user_id, role_id, status, is_billing_contact, is_security_contact, created_at",
      )
      .in("user_id", userIds);

    if (orgId) {
      memQuery = memQuery.eq("organization_id", orgId);
    }

    const { data: memberships, error: memError } = await memQuery;

    if (memError) throw new AppError("DB_ERROR", memError.message, 500);

    // Collect unique org and role IDs
    const orgIds = [
      ...new Set((memberships ?? []).map((m: { organization_id: string }) => m.organization_id)),
    ];
    const roleIds = [
      ...new Set((memberships ?? []).map((m) => m.role_id).filter((r): r is string => r !== null)),
    ];

    // Fetch organizations, roles, and all roles in parallel
    const [
      { data: organizations, error: orgsError },
      { data: roles, error: rolesError },
      { data: allRoles, error: allRolesError },
    ] = await Promise.all([
      orgIds.length > 0
        ? supabase
            .from("organizations")
            .select("id, name, slug, status, primary_domain, support_plan, created_at, updated_at")
            .in("id", orgIds)
        : { data: [], error: null },
      roleIds.length > 0
        ? supabase.from("roles").select("id, key, name").in("id", roleIds)
        : { data: [], error: null },
      supabase.from("roles").select("id, key, name"),
    ]);

    if (orgsError) throw new AppError("DB_ERROR", orgsError.message, 500);
    if (rolesError) throw new AppError("DB_ERROR", rolesError.message, 500);
    if (allRolesError) throw new AppError("DB_ERROR", allRolesError.message, 500);

    // Build the compound response
    const userIdsWithMemberships = new Set((memberships ?? []).map((m) => m.user_id));
    const compound = profiles
      .filter((p) => userIdsWithMemberships.has(p.id))
      .map((profile) => {
        const userMemberships = (memberships ?? []).filter((m) => m.user_id === profile.id);
        const orgIdsForUser = [...new Set(userMemberships.map((m) => m.organization_id))];
        const userOrganizations = (organizations ?? []).filter((o) => orgIdsForUser.includes(o.id));
        const userRoles = [
          ...new Set(userMemberships.map((m) => m.role_id).filter((r): r is string => r !== null)),
        ];

        return {
          user: {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            title: profile.title,
            is_super_admin: profile.is_super_admin,
            default_organization_id: profile.default_organization_id,
            created_at: profile.created_at,
          },
          profile: {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            title: profile.title,
            is_super_admin: profile.is_super_admin,
            default_organization_id: profile.default_organization_id,
            created_at: profile.created_at,
          },
          memberships: (memberships ?? []).filter((m) => m.user_id === profile.id),
          organizations: userOrganizations,
          roles: (roles ?? []).filter((r) => userRoles.includes(r.id)),
          allRoles: allRoles ?? [],
        };
      });

    res.json(success(compound));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (req.authUser?.userId !== String(req.params.id)) {
      // Caller must be an admin AND share their active organization with the
      // target (platform admins may read cross-tenant). Without the shared-org
      // check an admin of any tenant could read any profile's PII.
      await assertSharesActiveOrg(req, String(req.params.id));

      const supabase = getSupabaseAdmin();
      const { data: membership } = await supabase
        .from("memberships")
        .select("roles!inner(id, key)")
        .eq("user_id", req.authUser!.userId)
        .eq("status", "approved")
        .limit(1)
        .maybeSingle();

      const roleKey = roleKeyOf(membership?.roles);
      const isAdmin = !!roleKey && ["admin", "super_admin"].includes(roleKey);

      if (!isAdmin) {
        throw new AppError("FORBIDDEN", "Admin access required to view other users", 403);
      }
    }
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, title, is_super_admin, default_organization_id, created_at",
      )
      .eq("id", String(req.params.id))
      .single();

    if (error || !data) throw new AppError("NOT_FOUND", "User not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/detail", requireAdmin, async (req, res, next) => {
  try {
    await assertSharesActiveOrg(req, String(req.params.id));
    const supabase = getSupabaseAdmin();

    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, title, is_super_admin, default_organization_id, created_at",
      )
      .eq("id", String(req.params.id))
      .single();

    if (userError || !user) throw new AppError("NOT_FOUND", "User not found", 404);

    const { data: memberships, error: memError } = await supabase
      .from("memberships")
      .select(
        "id, organization_id, user_id, role_id, status, is_billing_contact, is_security_contact, created_at",
      )
      .eq("user_id", String(req.params.id));

    if (memError) throw new AppError("DB_ERROR", memError.message, 500);

    const orgIds = [
      ...new Set((memberships ?? []).map((m: { organization_id: string }) => m.organization_id)),
    ];
    const roleIds = [
      ...new Set((memberships ?? []).map((m) => m.role_id).filter((r): r is string => r !== null)),
    ];

    const [{ data: organizations, error: orgsError }, { data: roles, error: rolesError }] =
      await Promise.all([
        orgIds.length > 0
          ? supabase
              .from("organizations")
              .select(
                "id, name, slug, status, primary_domain, support_plan, created_at, updated_at",
              )
              .in("id", orgIds)
          : { data: [], error: null },
        roleIds.length > 0
          ? supabase.from("roles").select("id, key, name").in("id", roleIds)
          : { data: [], error: null },
      ]);

    if (orgsError) throw new AppError("DB_ERROR", orgsError.message, 500);
    if (rolesError) throw new AppError("DB_ERROR", rolesError.message, 500);

    const { data: allRoles, error: allRolesError } = await supabase
      .from("roles")
      .select("id, key, name");

    if (allRolesError) throw new AppError("DB_ERROR", allRolesError.message, 500);

    res.json(
      success({
        user,
        profile: user,
        memberships: memberships ?? [],
        organizations: organizations ?? [],
        roles: roles ?? [],
        allRoles: allRoles ?? [],
      }),
    );
  } catch (error) {
    next(error);
  }
});

// PRIV-P2-005: DSAR access/export. Returns the identity and membership record
// the platform holds for the subject so a rights request can be answered from
// a documented, audited path (see docs/runbooks/dsar.md).
router.get("/:id/export", async (req, res, next) => {
  try {
    const targetUserId = String(req.params.id);

    if (req.authUser!.userId !== targetUserId) {
      // Same gate as GET /:id: an admin who shares the caller's active org
      // (or a platform admin) may export on the subject's behalf.
      await assertSharesActiveOrg(req, targetUserId);

      const supabase = getSupabaseAdmin();
      const { data: membership } = await supabase
        .from("memberships")
        .select("roles!inner(id, key)")
        .eq("user_id", req.authUser!.userId)
        .eq("status", "approved")
        .limit(1)
        .maybeSingle();

      const roleKey = roleKeyOf(membership?.roles);
      const isAdmin = !!roleKey && ["admin", "super_admin"].includes(roleKey);
      if (!isAdmin) {
        throw new AppError("FORBIDDEN", "Admin access required to export another user's data", 403);
      }
    }

    const supabase = getSupabaseAdmin();
    const [
      { data: profile, error: profileError },
      { data: memberships, error: membershipError },
      { data: overrides, error: overrideError },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone, title, default_organization_id, created_at, updated_at",
        )
        .eq("id", targetUserId)
        .single(),
      supabase
        .from("memberships")
        .select(
          "id, organization_id, role_id, status, is_billing_contact, is_security_contact, created_at, roles(id, key, name), organizations(id, name)",
        )
        .eq("user_id", targetUserId),
      supabase
        .from("user_permission_overrides")
        .select("id, organization_id, permission_id, is_allowed")
        .eq("user_id", targetUserId),
    ]);

    if (profileError || !profile) throw new AppError("NOT_FOUND", "User not found", 404);
    if (membershipError) throw new AppError("DB_ERROR", membershipError.message, 500);
    if (overrideError) throw new AppError("DB_ERROR", overrideError.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "user.data.export",
      entityType: "user",
      entityId: targetUserId,
      metadata: { scope: "identity_and_memberships" },
    });

    res.json(
      success({
        exportedAt: new Date().toISOString(),
        subject: targetUserId,
        profile,
        memberships: memberships ?? [],
        permissionOverrides: overrides ?? [],
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/role", requirePermission("users", "manage"), async (req, res, next) => {
  try {
    const { roleId, organizationId } = z
      .object({
        roleId: z.string().min(1, "roleId is required"),
        organizationId: z.string().min(1, "organizationId is required"),
      })
      .parse(req.body);

    // Keep the role change inside the caller's active tenant (or require a
    // platform admin). Without this an admin could omit organizationId and
    // rewrite the target user's role across every organization.
    assertOrgScopeMatches(req, organizationId);

    const supabase = getSupabaseAdmin();

    // SEC-P1-001 / ADMIN-P1-003: shared guard — cross-tenant roles require a
    // platform super admin, and non-super-admins cannot change their own role.
    const targetRoleKey = await resolveRoleKey(supabase, roleId);
    await assertCanAssignRole(
      supabase,
      req.authUser!.userId,
      targetRoleKey,
      String(req.params.id),
    );

    const { error } = await supabase
      .from("memberships")
      .update({ role_id: roleId })
      .eq("user_id", String(req.params.id))
      .eq("organization_id", organizationId);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    // PERF-P2-003: the target's effective permissions changed.
    clearPermissionCache(String(req.params.id));

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "user.role.update",
      entityType: "user",
      entityId: String(String(req.params.id)),
      metadata: { roleId, organizationId },
    });

    res.json(success({ updated: true }));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/permissions", requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const userId = String(req.params.id);
    await assertSharesActiveOrg(req, userId);

    const [
      { data: memberships, error: memError },
      { data: allPermissions, error: permError },
      { data: overrides, error: ovrError },
    ] = await Promise.all([
      supabase
        .from("memberships")
        .select("id, organization_id, role_id, status, roles(key, name), organizations(name)")
        .eq("user_id", userId),
      supabase
        .from("permissions")
        .select("id, module_key, action_key, group_key, scope, label, description")
        .order("module_key")
        .order("action_key"),
      supabase
        .from("user_permission_overrides")
        .select("id, organization_id, permission_id, is_allowed")
        .eq("user_id", userId),
    ]);

    if (memError) throw new AppError("DB_ERROR", memError.message, 500);
    if (permError) throw new AppError("DB_ERROR", permError.message, 500);
    if (ovrError) throw new AppError("DB_ERROR", ovrError.message, 500);

    const rolePermissions = memberships?.length
      ? await supabase
          .from("role_permissions")
          .select("permission_id")
          .in(
            "role_id",
            memberships.map((m) => m.role_id).filter((r): r is string => r !== null),
          )
      : { data: [] as Array<{ permission_id: string }>, error: null };

    if (rolePermissions.error) throw new AppError("DB_ERROR", rolePermissions.error.message, 500);

    res.json(
      success({
        memberships: memberships ?? [],
        permissions: allPermissions ?? [],
        rolePermissionIds: (rolePermissions.data ?? []).map(
          (rp: { permission_id: string }) => rp.permission_id,
        ),
        overrides: overrides ?? [],
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.put("/:id/permissions", requirePermission("users", "manage"), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const userId = String(req.params.id);
    const { organizationId, permissionId, isAllowed } = z
      .object({
        organizationId: z.string().min(1, "organizationId is required"),
        permissionId: z.string().min(1, "permissionId is required"),
        isAllowed: z.boolean().nullable(),
      })
      .parse(req.body);

    // Overrides are org-scoped; the caller must be acting in that org (or be
    // a platform admin) so they cannot grant/deny in another tenant.
    assertOrgScopeMatches(req, organizationId);

    const { data: existing, error: checkError } = await supabase
      .from("user_permission_overrides")
      .select("id")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .eq("permission_id", permissionId)
      .maybeSingle();

    if (checkError) throw new AppError("DB_ERROR", checkError.message, 500);

    if (isAllowed === null) {
      if (existing) {
        const { error } = await supabase
          .from("user_permission_overrides")
          .delete()
          .eq("id", existing.id);
        if (error) throw new AppError("DB_ERROR", error.message, 500);
      }
    } else if (existing) {
      const { error } = await supabase
        .from("user_permission_overrides")
        .update({ is_allowed: isAllowed })
        .eq("id", existing.id);

      if (error) throw new AppError("DB_ERROR", error.message, 500);
    } else {
      const { error } = await supabase.from("user_permission_overrides").insert({
        user_id: userId,
        organization_id: organizationId,
        permission_id: permissionId,
        is_allowed: isAllowed,
      });

      if (error) throw new AppError("DB_ERROR", error.message, 500);
    }

    // PERF-P2-003: overrides feed the resolver's cache key for this user.
    clearPermissionCache(userId);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "user.permission.override",
      entityType: "user_permission_override",
      metadata: {
        targetUserId: userId,
        organizationId,
        permissionId,
        isAllowed,
      },
    });

    res.json(success({ updated: true }));
  } catch (error) {
    next(error);
  }
});

// PRIV-P2-005: DSAR erasure. Platform super admins only — erasure deletes the
// auth user (cascading the profile, memberships, overrides, sessions and MFA
// material) after scrubbing the profile PII, so a failure between the two steps
// cannot leave personal data behind. See docs/runbooks/dsar.md.
router.delete("/:id", requirePermission("users", "manage"), async (req, res, next) => {
  try {
    assertDeleteConfirmed(req.body);
    const targetUserId = String(req.params.id);

    if (targetUserId === req.authUser!.userId) {
      throw new AppError("VALIDATION", "You cannot erase your own account", 400);
    }

    const supabase = getSupabaseAdmin();

    const { data: caller, error: callerError } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", req.authUser!.userId)
      .maybeSingle();

    if (callerError) throw new AppError("DB_ERROR", callerError.message, 500);
    if (!caller?.is_super_admin) {
      throw new AppError("FORBIDDEN", "Super admin access required for account erasure", 403);
    }

    const { data: target, error: targetError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetError) throw new AppError("DB_ERROR", targetError.message, 500);
    if (!target) throw new AppError("NOT_FOUND", "User not found", 404);

    // 1. Scrub the profile PII first (fail-safe: if the auth delete below
    //    fails, the row is already de-identified).
    const { error: scrubError } = await supabase
      .from("profiles")
      .update({
        full_name: null,
        email: null,
        phone: null,
        title: null,
        avatar_url: null,
        encrypted_pii: null,
        metadata: {},
        is_super_admin: false,
      })
      .eq("id", targetUserId);

    if (scrubError) throw new AppError("DB_ERROR", scrubError.message, 500);

    // 2. Delete the auth user. FK cascades remove the profile row, memberships,
    //    permission overrides, sessions, MFA factors and recovery codes.
    const { error: authError } = await supabase.auth.admin.deleteUser(targetUserId);
    if (authError) throw new AppError("DB_ERROR", authError.message, 500);

    // PERF-P2-003: drop any cached resolution for the erased account.
    clearPermissionCache(targetUserId);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "user.account.erased",
      entityType: "user",
      entityId: targetUserId,
      metadata: { method: "auth.admin.deleteUser + profile scrub" },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
