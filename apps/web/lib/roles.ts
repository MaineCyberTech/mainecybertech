/**
 * Role key constants shared across the web app.
 *
 * PLATFORM_ADMIN_KEYS: MSP-internal roles that can use the admin portal.
 *
 * NOTE: this is an ADMIN-PORTAL ACCESS gate, not a tenant-scope gate. Matching
 * on this list only decides whether the portal UI is shown. Cross-tenant data
 * reach is decided server-side by apps/api/src/lib/admin-scope.ts, which
 * requires BOTH the is_super_admin profile flag AND a CROSS_TENANT_KEYS role
 * (admin/super_admin) — a plain `finance`/`dispatcher` holder reaches the portal
 * but is scoped to their own orgs by the API.
 *
 * Keep in sync with apps/api/src/lib/roles.ts (which splits CROSS_TENANT_KEYS
 * from ELEVATED_TENANT_KEYS) and
 * supabase/migrations/5302128_role_catalog_expansion.sql.
 */
export const PLATFORM_ADMIN_KEYS = [
  "super_admin",
  "admin",
  "dispatcher",
  "engineer",
  "security-analyst",
  "project-manager",
  "finance",
  "onboarding-specialist",
] as const;

export function isPlatformAdminKey(key: string | null | undefined): boolean {
  return key != null && (PLATFORM_ADMIN_KEYS as readonly string[]).includes(key);
}
