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

/**
 * Extract a role key from a Supabase embedded `roles` value.
 *
 * A `roles!inner(id, key)` embed on `memberships` is a many-to-one join, but
 * the generated types mark every relationship `isOneToOne: false`, so the
 * value can arrive shaped as either an object or a single-element array
 * depending on the client/version. Handle both — reading `.key` off an array
 * silently yields `undefined`, which made platform-admin detection fail
 * (admins got scoped to a single org / denied cross-tenant).
 */
export function roleKeyOf(roles: unknown): string | undefined {
  const row = Array.isArray(roles) ? roles[0] : roles;
  return (row as { key?: string } | null | undefined)?.key;
}
