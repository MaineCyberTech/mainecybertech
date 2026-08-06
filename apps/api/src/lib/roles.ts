/**
 * Role key constants shared across the API.
 *
 * PLATFORM_ADMIN_KEYS: MSP-internal roles that work across ALL tenants
 * (org-agnostic — no default org injection, bypass tenant scoping).
 * Keep in sync with the role catalog in
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
