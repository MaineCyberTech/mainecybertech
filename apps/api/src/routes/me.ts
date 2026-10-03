import { Router } from "express";
import { success } from "../types";
import { requireAuth } from "../middleware/auth";
import { resolveEffectivePermissions } from "../lib/permissions";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);

/**
 * GET /api/v1/me/permissions
 *
 * Returns the current user's effective permission set computed from
 * approved memberships -> role_permissions -> permissions, with
 * per-org user_permission_overrides applied. Super admins bypass the
 * computation and receive every permission.
 */
router.get("/permissions", async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const resolved = await resolveEffectivePermissions(userId);

    res.json(
      success({
        isSuperAdmin: resolved.isSuperAdmin,
        permissions: resolved.permissions,
        keys: [...resolved.keys],
        roles: resolved.roles,
        memberships: resolved.memberships,
      }),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
