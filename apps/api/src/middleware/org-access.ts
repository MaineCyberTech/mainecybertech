import { type Request, type Response, type NextFunction } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError } from "../types";
import { getEnv } from "../config/env";
import { logger } from "../lib/logger";

const isTest = getEnv().NODE_ENV === "test";

function extractOrgId(req: Request): string | null {
  if (req.query.organization_id) return req.query.organization_id as string;
  if (req.body?.organizationId) return req.body.organizationId;
  return null;
}

async function checkOrgAccess(userId: string, orgId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data: membership } = await supabase
    .from("memberships")
    .select("id, roles!inner(id, key)")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .eq("status", "approved")
    .maybeSingle();

  if (membership) return true;

  const { data: allMemberships } = await supabase
    .from("memberships")
    .select("id, roles!inner(id, key)")
    .eq("user_id", userId)
    .eq("status", "approved");

  if (allMemberships && allMemberships.length > 0) {
    const isAdmin = allMemberships.some((row) =>
      ["admin", "super_admin"].includes((row.roles as unknown as { key: string }).key),
    );
    if (isAdmin) return true;
  }

  return false;
}

/**
 * Resolve the user's preferred active organization: explicit
 * orgId param/body wins, then the X-Active-Org header (web server
 * forwarding the mct_active_org cookie), then the mct_active_org
 * cookie itself (browser requests).
 */
function extractActiveOrgId(req: Request): string | null {
  if (req.query.organization_id) return req.query.organization_id as string;
  if (req.body?.organizationId) return req.body.organizationId;

  const header = req.headers?.["x-active-org"];
  if (typeof header === "string" && header.length > 0) return header;

  const cookieOrg = (req.cookies as Record<string, string> | undefined)?.["mct_active_org"];
  if (typeof cookieOrg === "string" && cookieOrg.length > 0) return cookieOrg;

  return null;
}

async function resolveDefaultOrgId(
  userId: string,
  activeOrgId: string | null,
): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  if (activeOrgId) {
    const { data: active } = await supabase
      .from("memberships")
      .select("organization_id, roles!inner(id, key)")
      .eq("user_id", userId)
      .eq("organization_id", activeOrgId)
      .eq("status", "approved")
      .limit(1);

    if (active && active.length > 0) {
      return active[0].organization_id as string;
    }
  }

  const { data: memberships } = await supabase
    .from("memberships")
    .select("organization_id, roles!inner(id, key)")
    .eq("user_id", userId)
    .eq("status", "approved")
    .order("created_at", { ascending: true })
    .limit(1);

  if (!memberships || memberships.length === 0) return null;
  return memberships[0].organization_id as string;
}

export async function requireOrgAccess(req: Request, _res: Response, next: NextFunction) {
  if (isTest) {
    logger.warn("requireOrgAccess bypassed in test mode — tenant isolation not enforced");
    return next();
  }

  try {
    if (!req.authUser) {
      throw new AppError("UNAUTHORIZED", "Authentication required", 401);
    }

    const orgId = extractOrgId(req);
    if (!orgId) {
      const activeOrgId = extractActiveOrgId(req);
      const defaultOrgId = await resolveDefaultOrgId(req.authUser.userId, activeOrgId);
      if (!defaultOrgId) {
        throw new AppError("FORBIDDEN", "No approved organization membership found", 403);
      }
      req.query = { ...req.query, organization_id: defaultOrgId };
      next();
      return;
    }

    const hasAccess = await checkOrgAccess(req.authUser.userId, orgId);
    if (!hasAccess) {
      throw new AppError("FORBIDDEN", "You do not have access to this organization", 403);
    }

    next();
  } catch (error) {
    next(error);
  }
}

export async function requireOrgAccessByParam(req: Request, _res: Response, next: NextFunction) {
  if (isTest) {
    logger.warn("requireOrgAccessByParam bypassed in test mode — tenant isolation not enforced");
    return next();
  }

  try {
    if (!req.authUser) {
      throw new AppError("UNAUTHORIZED", "Authentication required", 401);
    }

    const orgId = req.params.id as string;
    if (!orgId) {
      throw new AppError("VALIDATION", "Organization ID is required", 400);
    }

    const hasAccess = await checkOrgAccess(req.authUser.userId, orgId);
    if (!hasAccess) {
      throw new AppError("FORBIDDEN", "You do not have access to this organization", 403);
    }

    next();
  } catch (error) {
    next(error);
  }
}
