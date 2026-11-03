import type { Request } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError } from "../types";
import { isCrossTenantKey, roleKeyOf } from "./roles";

/**
 * Resolved tenant visibility for a `requireAdmin`-gated read.
 *
 * `allTenants` is true only for a genuine cross-tenant admin: a caller whose
 * profile carries `is_super_admin` *and* whose approved memberships include a
 * cross-tenant role key (`admin`/`super_admin`). A plain single-org `admin`
 * is deliberately NOT cross-tenant here — the role alone is not enough, which
 * is the fix for audit MT-P1-001 / MT-P1-002 / ADMIN-P1-001 (and mirrors the
 * hardened `routes/search.ts`).
 *
 * `orgIds` is the caller's authoritative tenant list. For a caller without an
 * admin role it is their approved membership list; for an admin it is the org
 * resolved for this request, or the orgs where they actually hold
 * `admin`/`super_admin` when unpinned — never every org they merely belong to.
 * Callers must apply it as a mandatory predicate and never let a
 * caller-supplied `organization_id` widen beyond it.
 */
export interface AdminTenantScope {
  allTenants: boolean;
  orgIds: string[];
}

/** Sentinel UUID predicate that matches no rows, so an empty scope fails closed. */
export const NO_ORG_MATCH = "00000000-0000-0000-0000-000000000000";

/**
 * Per-request memo. The response cache resolves the scope before the handler
 * runs (middleware/cache.ts) and the handler resolves it again; memoizing keeps
 * that to a single pair of membership/profile lookups per request (MT-P1-004).
 */
const scopeByRequest = new WeakMap<Request, Promise<AdminTenantScope>>();

export function resolveAdminTenantScope(req: Request): Promise<AdminTenantScope> {
  const cached = scopeByRequest.get(req);
  if (cached) return cached;
  const resolved = computeAdminTenantScope(req);
  scopeByRequest.set(req, resolved);
  return resolved;
}

async function computeAdminTenantScope(req: Request): Promise<AdminTenantScope> {
  const userId = req.authUser?.userId;
  if (!userId) return { allTenants: false, orgIds: [] };

  const supabase = getSupabaseAdmin();

  const [{ data: memberships }, { data: profile }] = await Promise.all([
    supabase
      .from("memberships")
      .select("organization_id, roles!inner(id, key)")
      .eq("user_id", userId)
      .eq("status", "approved"),
    supabase.from("profiles").select("is_super_admin").eq("id", userId).maybeSingle(),
  ]);

  const rows = (memberships ?? []) as Array<{
    organization_id?: string | null;
    roles?: unknown;
  }>;

  const allOrgIds = rows.map((m) => m.organization_id).filter((id): id is string => Boolean(id));
  // Admin scope is the set of orgs where the caller actually holds an
  // admin/super_admin role — never every org they merely belong to. Otherwise
  // `admin` in org A plus `client_user` in org B let an unpinned admin request
  // read/write B's audit trail, dashboard and tickets (MT-P1-005).
  const adminOrgIds = rows
    .filter((m) => isCrossTenantKey(roleKeyOf(m.roles)))
    .map((m) => m.organization_id)
    .filter((id): id is string => Boolean(id));
  const holdsCrossTenantRole = adminOrgIds.length > 0;
  const allTenants =
    (profile as { is_super_admin?: boolean } | null)?.is_super_admin === true &&
    holdsCrossTenantRole;

  if (allTenants) {
    return { allTenants: true, orgIds: allOrgIds };
  }

  // A caller with an admin role is confined to the org resolved for THIS
  // request (or to their admin orgs when the request is unpinned). A user who
  // is `admin` in A and `client_user` in B must be able to act in B only when
  // B is explicitly selected, and never inherits B from an unpinned admin
  // request (MT-P1-005).
  if (holdsCrossTenantRole) {
    const pinnedOrgId = req.orgScope?.orgId ?? req.orgId ?? null;
    return {
      allTenants: false,
      orgIds: pinnedOrgId ? [pinnedOrgId] : adminOrgIds,
    };
  }

  // Non-admin callers keep the legacy "all approved orgs" scope used by
  // exports and other tenant reads; only admin scope was over-wide.
  return { allTenants: false, orgIds: allOrgIds };
}

/**
 * Apply the mandatory org predicate for a tenant-scoped table.
 *
 * - Cross-tenant admins: no predicate (they see every tenant) unless the
 *   caller explicitly filtered by an org, in which case `applyRequestedOrg`
 *   has already narrowed it.
 * - Everyone else: restricted to their own approved orgs, failing closed.
 */
export function applyOrgScope<T>(query: T, column: string, scope: AdminTenantScope): T {
  if (scope.allTenants) return query;
  const ids = scope.orgIds.length > 0 ? scope.orgIds : [NO_ORG_MATCH];
  // Supabase's generated builder types make generic predicate helpers awkward;
  // the runtime builder is duck-typed, matching the rest of the routes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (query as any).in(column, ids) as T;
}

/**
 * Narrow a query to a caller-supplied `organization_id` without letting it
 * widen scope. A non-cross-tenant admin may only request an org they are
 * actually a member of; anything else is a 403. Cross-tenant admins may
 * request any org.
 *
 * Returns the query unchanged when no explicit org was requested.
 */
export function applyRequestedOrg<T>(
  query: T,
  column: string,
  requestedOrg: string | undefined,
  scope: AdminTenantScope,
): T {
  if (!requestedOrg) return query;
  if (!scope.allTenants && !scope.orgIds.includes(requestedOrg)) {
    throw new AppError("FORBIDDEN", "You do not have access to this organization", 403);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (query as any).eq(column, requestedOrg) as T;
}

/**
 * Mandatory org predicate for a tenant-scoped read (MT-P2-002).
 *
 * The legacy `if (orgId) query = query.eq(...)` idiom fails OPEN when the
 * org-access gate did not run: the predicate is silently skipped and the query
 * returns every tenant's rows. This helper only ever narrows:
 *
 * - a resolved org (`req.orgId`, set by `requireOrgAccess` for members, API
 *   keys and explicit/active-org switches) always becomes a predicate;
 * - otherwise an explicit `organization_id`/`organizationId` supplied by the
 *   caller (already validated by the gate when it ran) becomes the predicate;
 * - an org-agnostic platform admin (`req.orgScope.platformAdmin` with no org)
 *   is intentionally cross-tenant and audited by the gate, so the query stays
 *   unscoped;
 * - anything else — no gate, no scope — fails closed with a 403 instead of
 *   returning an unscoped result.
 */
export function applyResolvedOrg<T>(req: Request, query: T, column = "organization_id"): T {
  const explicitQuery =
    typeof req.query?.organization_id === "string" ? req.query.organization_id : undefined;
  const explicitBody =
    typeof req.body?.organizationId === "string" ? req.body.organizationId : undefined;
  const orgId = req.orgId ?? explicitQuery ?? explicitBody;

  if (orgId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (query as any).eq(column, orgId) as T;
  }
  if (req.orgScope?.platformAdmin) return query;
  throw new AppError("FORBIDDEN", "No organization scope resolved for this request", 403);
}
