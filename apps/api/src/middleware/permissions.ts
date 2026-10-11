/**
 * requirePermission(moduleKey, action) — API-layer permission enforcement
 * (audit SEC-P1-001: the permission catalog was UI-only, so any org member
 * could perform every write via the API).
 *
 * Resolution mirrors requireOrgAccess org determination (query
 * organization_id -> body organizationId -> X-Active-Org header ->
 * mct_active_org cookie), then resolveEffectivePermissions() computes the
 * union of role_permissions for the user's approved memberships in that
 * org, applies user_permission_overrides (allow adds, deny removes), and
 * denies with 403 unless the `${moduleKey}:${action}` key is present.
 *
 * Trusted bypasses (match requireAdmin semantics):
 *  - super_admin profiles (resolved inside resolveEffectivePermissions)
 *  - any approved membership with an admin/super_admin role key — even
 *    when operating on a tenant where they hold no membership (platform
 *    admins can switch into every org via the org switcher).
 *
 * The new MSP platform roles (engineer, dispatcher, security-analyst,
 * project-manager, finance, onboarding-specialist) are NOT bypassed —
 * they are governed by their role_permissions from the migration
 * 5302128 catalog. See docs for catalog gaps this surfaces.
 *
 * API keys are an additional cap (SEC-P2-004 / ACM-P2-008 / CHAIN-P2-008):
 * when `req.apiKey` is present the key's stored scope list must contain the
 * requested `${moduleKey}:${action}` before any creator-side resolution or
 * admin bypass is considered. A key therefore acts with the INTERSECTION of
 * its stored scopes and its creator's current effective permissions, and a
 * scoped key minted by an admin/super_admin cannot use the creator's full
 * authority.
 */
import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../types";
import { resolveEffectivePermissions, ADMIN_BYPASS_KEYS } from "../lib/permissions";

export type PermissionAction = "view" | "create" | "edit" | "delete" | "manage";

function isAdminBypassRole(roleKey: string | null | undefined): boolean {
  return roleKey != null && (ADMIN_BYPASS_KEYS as readonly string[]).includes(roleKey);
}

function extractOrgId(req: Request): string | null {
  if (req.query.organization_id) return req.query.organization_id as string;
  if (req.body?.organizationId) return req.body.organizationId as string;

  const header = req.headers?.["x-active-org"];
  if (typeof header === "string" && header.length > 0) return header;

  const cookieOrg = (req.cookies as Record<string, string> | undefined)?.["mct_active_org"];
  if (typeof cookieOrg === "string" && cookieOrg.length > 0) return cookieOrg;

  // Fall back to the org resolved by upstream middleware (e.g.
  // requireOrgAccessByParam sets req.orgId from the `:id` param but does not
  // touch the query). Without this, permission resolution would union grants
  // across every org the user belongs to.
  const scopedOrg = (req as Request & { orgId?: string | null }).orgId;
  if (typeof scopedOrg === "string" && scopedOrg.length > 0) return scopedOrg;

  return null;
}

export function requirePermission(moduleKey: string, action: PermissionAction) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Evaluated per-request, not at module load.

    try {
      if (!req.authUser) {
        throw new AppError("UNAUTHORIZED", "Authentication required", 401);
      }

      const permissionKey = `${moduleKey}:${action}`;

      // API-key scope cap (SEC-P2-004 / ACM-P2-008 / CHAIN-P2-008): a key may
      // only exercise the permissions it was minted with. This check runs
      // before creator-side resolution so the admin/super_admin bypass below
      // can never widen a scoped key to its creator's full authority. Keys
      // with an empty scope list are denied every gated permission.
      if (req.apiKey && !req.apiKey.permissions.includes(permissionKey)) {
        throw new AppError("FORBIDDEN", "API key is not scoped for this permission", 403);
      }

      const orgId = extractOrgId(req);
      const userId = req.authUser.userId;

      const resolved = await resolveEffectivePermissions(userId, orgId);

      // super_admin profiles already bypass inside the resolver.
      // admin/super_admin role memberships bypass here (requireAdmin parity).
      if (
        resolved.isSuperAdmin ||
        resolved.roles.some(isAdminBypassRole) ||
        resolved.keys.has(permissionKey)
      ) {
        return next();
      }

      // Platform admins (admin/super_admin role in any org) may operate on
      // tenants where they hold no membership — re-resolve org-agnostically
      // to confirm the bypass before denying.
      if (orgId && resolved.roles.length === 0) {
        const fallback = await resolveEffectivePermissions(userId, null);
        if (fallback.isSuperAdmin || fallback.roles.some(isAdminBypassRole)) {
          return next();
        }
      }

      throw new AppError("FORBIDDEN", "You do not have permission", 403);
    } catch (error) {
      next(error);
    }
  };
}
