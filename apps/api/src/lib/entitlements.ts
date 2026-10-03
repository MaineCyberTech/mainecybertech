/**
 * Shared module-entitlement derivation (BILL-P1-001).
 *
 * Historically this logic lived only in routes/client-portal.ts and was
 * returned to the browser as `enabledModules` — an advisory UI hint that was
 * never checked server-side. Moving it here gives the route and the
 * `requireEntitlement` middleware a single source of truth so the set the
 * client renders can never diverge from the set the server enforces.
 *
 * Precedence (matches the bootstrap payload):
 *   1. Admin-provisioned `client_portal_entitlements` rows for the org
 *      (when at least one enabled row exists) win outright.
 *   2. Otherwise the subscription-derived set: an active/trialing
 *      subscription unlocks the premium modules, anything else falls back to
 *      the default set.
 */
import { getSupabaseAdmin } from "../services/supabase";
import { AppError } from "../types";

/** Modules every tenant gets regardless of subscription state. */
export const DEFAULT_ENABLED_MODULES: string[] = [
  "dashboard",
  "support",
  "documents",
  "projects",
  "billing",
  "status",
  "notifications",
  "profile",
];

/** Modules unlocked when an org has an active/trialing subscription. */
export const SUBSCRIPTION_ENABLED_MODULES: string[] = [
  ...DEFAULT_ENABLED_MODULES,
  "findings",
  "security-ops",
  "governance",
  "training-hub",
  "service-catalog",
  "qbr",
];

/**
 * Premium modules whose access is gated by a subscription/entitlement.
 * These are the modules a paying subscription unlocks (everything in
 * SUBSCRIPTION_ENABLED_MODULES that is not part of the default set).
 */
export const GATED_MODULES: readonly string[] = SUBSCRIPTION_ENABLED_MODULES.filter(
  (moduleKey) => !DEFAULT_ENABLED_MODULES.includes(moduleKey),
);

export function deriveEnabledModules(subscriptionActive: boolean): string[] {
  return subscriptionActive ? SUBSCRIPTION_ENABLED_MODULES : DEFAULT_ENABLED_MODULES;
}

export function isSubscriptionActive(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

export interface OrgEntitlements {
  /** Resolved set of enabled module keys for the org. */
  enabledModules: string[];
  /** True when the org's primary subscription is active or trialing. */
  subscriptionActive: boolean;
  /** Where the resolved set came from. */
  source: "provisioned" | "subscription";
}

/**
 * Resolve the effective module entitlements for one organization.
 *
 * Reads `subscriptions` and `client_portal_entitlements` with the service-role
 * client (callers are already past auth/org-access). When an org has multiple
 * subscriptions the active/trialing one wins; otherwise the most recently
 * updated row is used, mirroring `stripe-reconcile`.
 */
export async function resolveOrgEntitlements(organizationId: string): Promise<OrgEntitlements> {
  const supabase = getSupabaseAdmin();

  const [{ data: subscriptions, error: subError }, { data: entitlements, error: entError }] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("status, updated_at")
        .eq("organization_id", organizationId),
      supabase
        .from("client_portal_entitlements")
        .select("module_key, enabled")
        .eq("organization_id", organizationId),
    ]);

  if (subError) throw new AppError("DB_ERROR", subError.message, 500);
  if (entError) throw new AppError("DB_ERROR", entError.message, 500);

  const rows = subscriptions ?? [];
  const activeSub = rows.find((s) => isSubscriptionActive(s.status));
  const mostRecent = [...rows].sort((a, b) =>
    (b.updated_at ?? "").localeCompare(a.updated_at ?? ""),
  )[0];
  const subscriptionActive = isSubscriptionActive((activeSub ?? mostRecent)?.status);

  const provisioned = (entitlements ?? [])
    .filter((e) => e.enabled)
    .map((e) => e.module_key);

  if (provisioned.length > 0) {
    return { enabledModules: provisioned, subscriptionActive, source: "provisioned" };
  }

  return {
    enabledModules: deriveEnabledModules(subscriptionActive),
    subscriptionActive,
    source: "subscription",
  };
}
