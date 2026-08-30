/**
 * Role key constants shared across the web app.
 *
 * PLATFORM_ADMIN_KEYS: MSP-internal roles that can use the admin portal
 * and work across ALL tenants. Keep in sync with
 * apps/api/src/lib/roles.ts and
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
