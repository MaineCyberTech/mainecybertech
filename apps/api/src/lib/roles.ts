/**
 * Role key constants shared across the API.
 *
 * MSP-internal roles are split into two trust tiers because they were
 * previously one set (`PLATFORM_ADMIN_KEYS`), which meant a low-trust MSP role
 * like `finance` or `onboarding-specialist` could cross tenant boundaries via
 * requireOrgAccess for reads while being denied by requirePermission — an
 * inconsistent model (audit findings SEC-P2-002 / CHAIN-P1-001, run
 * 20261002-0344).
 *
 * CROSS_TENANT_KEYS
 *   May operate across ALL tenants: org-agnostic (no default-org injection),
 *   they bypass tenant scoping in requireOrgAccess, and every cross-tenant
 *   entry is logged as impersonation. This is the original PLATFORM_ADMIN_KEYS
 *   trust level and is the ONLY set that grants cross-tenant access.
 *
 * ELEVATED_TENANT_KEYS
 *   MSP staff who are trusted inside any tenant they are a *member* of, but
 *   have no blanket cross-tenant reach. Without an explicit org they are pinned
 *   to their first membership like any tenant user.
 *
 * Both sets are kept in sync with the role catalog in
 * supabase/migrations/5302128_role_catalog_expansion.sql.
 */

/** Roles that may cross tenant boundaries (audited per access). */
export const CROSS_TENANT_KEYS = ["super_admin", "admin"] as const;

/** MSP staff roles with elevated in-tenant standing, no cross-tenant reach. */
export const ELEVATED_TENANT_KEYS = [
  "dispatcher",
  "engineer",
  "security-analyst",
  "project-manager",
  "finance",
  "onboarding-specialist",
] as const;

/**
 * @deprecated Prefer `isCrossTenantKey` for cross-tenant access checks.
 * Retained because several call sites mean "is this an MSP staff role?" (which
 * spans both tiers). Do NOT use this where the question is cross-tenant reach.
 */
export const PLATFORM_ADMIN_KEYS = [
  ...CROSS_TENANT_KEYS,
  ...ELEVATED_TENANT_KEYS,
] as const;

/** True when the key belongs to any MSP staff tier. */
export function isPlatformAdminKey(key: string | null | undefined): boolean {
  return key != null && (PLATFORM_ADMIN_KEYS as readonly string[]).includes(key);
}

/**
 * True only for roles that may cross tenant boundaries. Use this for
 * cross-tenant access decisions; use `isPlatformAdminKey` for "is MSP staff".
 */
export function isCrossTenantKey(key: string | null | undefined): boolean {
  return key != null && (CROSS_TENANT_KEYS as readonly string[]).includes(key);
}

/** True for MSP staff roles that are elevated within a tenant they belong to. */
export function isElevatedTenantKey(key: string | null | undefined): boolean {
  return key != null && (ELEVATED_TENANT_KEYS as readonly string[]).includes(key);
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
