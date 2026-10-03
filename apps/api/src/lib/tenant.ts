import type { Request } from "express";
import { AppError } from "../types";
import { logImpersonation } from "../services/impersonation";

/**
 * Resolved tenant scope for a request. Populated by the org-access middleware
 * (see middleware/org-access.ts) into `req.orgScope`. It deliberately mirrors
 * the de-facto org-isolation rules already enforced by `requireOrgAccess`.
 */
export interface OrgScope {
  /** Active organization id, or null for a platform admin with no explicit org. */
  orgId: string | null;
  /** True when the org was supplied explicitly (query/body/active-org/param). */
  explicit: boolean;
  /** True when the caller is a platform-admin role (org-agnostic by design). */
  platformAdmin: boolean;
  /** True when this request is a cross-tenant impersonation. */
  impersonation: boolean;
}

/**
 * Throw `NOT_FOUND` (404) unless `resourceOrgId` is within the caller's
 * resolved tenant scope.
 *
 * Semantics (mirror of current de-facto rules):
 *  - Platform admins acting WITHOUT an explicit org (`platformAdmin && !explicit`)
 *    are org-agnostic and may reach any tenant. The cross-tenant access is
 *    audited via `logImpersonation` (same trail as middleware/org-access.ts).
 *  - Otherwise the row must belong to `req.orgScope.orgId`, else 404.
 *  - If no scope was resolved at all we fail safe to 404.
 */
export function assertResourceOrg(
  req: Request,
  resourceOrgId: string | null | undefined,
): void {
  const scope = req.orgScope as OrgScope | undefined;

  if (!scope) {
    throw new AppError("NOT_FOUND", "Resource not found", 404);
  }

  if (scope.platformAdmin && !scope.explicit) {
    // Org-agnostic platform admin: allow, but keep an audit trail of the
    // concrete cross-tenant resource that was touched.
    if (resourceOrgId) {
      void logImpersonation({
        actorUserId: req.authUser?.userId ?? "unknown",
        actorRoleKey: "platform-admin",
        organizationId: resourceOrgId,
        reason: "cross_tenant_resource_access",
        req,
      });
    }
    return;
  }

  if (resourceOrgId !== scope.orgId) {
    throw new AppError("NOT_FOUND", "Resource not found", 404);
  }
}

/**
 * Load a row by id, verify it belongs to the caller's tenant, and return it.
 * Throws 404 when the row is missing OR out of scope.
 */
export async function loadOwned(
  req: Request,
  supabase: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: unknown) => {
          maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
        };
      };
    };
  },
  table: string,
  id: string,
  select: string = "*",
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new AppError("DB_ERROR", (error as { message?: string })?.message ?? "Query failed", 500);
  }
  if (!data) {
    throw new AppError("NOT_FOUND", "Resource not found", 404);
  }

  const row = data as Record<string, unknown>;
  assertResourceOrg(req, row.organization_id as string | null | undefined);
  return row;
}
