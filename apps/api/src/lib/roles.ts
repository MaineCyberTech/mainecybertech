/**
 * Role key helpers for the API.
 *
 * ADMIN-P3-001: the constants and predicates live in the shared,
 * dependency-free `@mct/sdk/role-keys` module so the API `requireAdmin` gate
 * and the web admin gate (`apps/web/lib/auth/admin.ts`) cannot drift. This
 * file remains the import surface for existing API code.
 *
 * CROSS_TENANT_KEYS   — may operate across all tenants (admin/super_admin);
 *                       this is the set `requireAdmin` accepts.
 * ELEVATED_TENANT_KEYS — MSP staff elevated inside their own orgs only.
 * PLATFORM_ADMIN_KEYS — the union of both (MSP staff), not a cross-tenant grant.
 *
 * Both sets are kept in sync with the role catalog in
 * supabase/migrations/5302128_role_catalog_expansion.sql.
 */
export {
  CROSS_TENANT_KEYS,
  ELEVATED_TENANT_KEYS,
  PLATFORM_ADMIN_KEYS,
  isCrossTenantKey,
  isElevatedTenantKey,
  isPlatformAdminKey,
  roleKeyOf,
} from "@mct/sdk/role-keys";
