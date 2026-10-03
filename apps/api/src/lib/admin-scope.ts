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
 * `orgIds` is the caller's approved organization list. Callers must apply it
 * as a mandatory predicate and never let a caller-supplied `organization_id`
 * widen beyond it.
 */
export interface AdminTenantScope {
  allTenants: boolean;
  orgIds: string[];
}

/** Sentinel UUID predicate that matches no rows, so an empty scope fails closed. */
export const NO_ORG_MATCH = "00000000-0000-0000-0000-000000000000";

export async function resolveAdminTenantScope(req: Request): Promise<AdminTenantScope> {
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

  const orgIds = rows.map((m) => m.organization_id).filter((id): id is string => Boolean(id));
  // `.some`, NOT `.find`: the memberships query has no ORDER BY, so picking the
  // first non-null role key made `allTenants` depend on row order for a user
  // with several memberships (e.g. `admin` in one org, `member` in another).
  // `some` asks the order-independent question we actually mean: does this user
  // hold a cross-tenant role ANYWHERE.
  const holdsCrossTenantRole = rows.some((m) => isCrossTenantKey(roleKeyOf(m.roles)));
  const allTenants =
    (profile as { is_super_admin?: boolean } | null)?.is_super_admin === true &&
    holdsCrossTenantRole;

  return { allTenants, orgIds };
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
