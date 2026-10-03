import { type Request, type Response, type NextFunction } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError } from "../types";
import { isCrossTenantKey, roleKeyOf } from "../lib/roles";

/**
 * Admin gate.
 *
 * Historically this answered only "is the caller an admin *somewhere*?" — it
 * queried approved memberships by `user_id` alone, so a tenant admin of Org A
 * passed for every route and could read Org B's data wherever the route was
 * not separately org-scoped (audit ADMIN-P1-001 / MT-P1-001).
 *
 * New, safer semantics: when an upstream `requireOrgAccess` has pinned the
 * request to an explicit organization (`req.orgScope.explicit && req.orgId`),
 * a tenant `admin` must hold that admin role **in that organization**. Only
 * `super_admin` is cross-tenant by design. Requests that are not org-pinned
 * (no `requireOrgAccess`, or an org-agnostic switch) keep the previous
 * "admin in any org" behavior so existing routers are unaffected; org-scoped
 * read routes must still enforce `req.orgId` / their own membership filter.
 */
export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.authUser) {
      throw new AppError("UNAUTHORIZED", "Authentication required", 401);
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("memberships")
      .select("organization_id, roles!inner(id, key)")
      .eq("user_id", req.authUser.userId)
      .eq("status", "approved");

    if (error || !data || data.length === 0) {
      throw new AppError("FORBIDDEN", "Admin access required", 403);
    }

    const adminRows = data.filter((row) => isCrossTenantKey(roleKeyOf(row.roles)));

    if (adminRows.length === 0) {
      throw new AppError("FORBIDDEN", "Admin access required", 403);
    }

    // Org-pinned requests require an admin role in the pinned org, unless the
    // caller is a cross-tenant super_admin. A single-org `admin` cannot widen
    // scope by supplying another tenant's id (ADMIN-P1-001).
    if (req.orgScope?.explicit === true && req.orgId) {
      const pinnedOrg = req.orgId;
      const hasSuperAdmin = adminRows.some((row) => roleKeyOf(row.roles) === "super_admin");
      const adminInOrg = adminRows.some(
        (row) => (row as { organization_id?: string | null }).organization_id === pinnedOrg,
      );
      if (!hasSuperAdmin && !adminInOrg) {
        throw new AppError("FORBIDDEN", "Admin access required", 403);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}
