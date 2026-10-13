/**
 * Role key helpers shared across the web app.
 *
 * ADMIN-P3-001: re-exported from `@mct/sdk/role-keys` so the web admin gate and
 * the API `requireAdmin` use the same role sets.
 *
 * - `isCrossTenantKey` (super_admin/admin) is the API `requireAdmin` parity
 *   check and is what `requireAdminAccess` uses for the admin portal.
 * - `isPlatformAdminKey` spans both MSP tiers (cross-tenant + elevated tenant
 *   roles) and is only for "is this MSP staff?" decisions such as the login
 *   landing redirect — NOT for cross-tenant access.
 *
 * Cross-tenant data reach is decided server-side by
 * apps/api/src/lib/admin-scope.ts, which requires BOTH the is_super_admin
 * profile flag AND a CROSS_TENANT_KEYS role.
 *
 * Keep in sync with supabase/migrations/5302128_role_catalog_expansion.sql.
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
