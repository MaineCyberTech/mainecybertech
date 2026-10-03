/**
 * requireEntitlement(moduleKey) / requireActiveSubscription — server-side
 * module-entitlement enforcement (audit BILL-P1-001).
 *
 * Before this middleware the derived `enabledModules` list in the client
 * portal bootstrap was a UI hint only: any authenticated member of an org
 * with a canceled/expired subscription could still call the premium feature
 * APIs directly. This closes that gap by resolving the org's effective
 * entitlements via `lib/entitlements.ts` (the same derivation the bootstrap
 * payload uses) and rejecting requests for modules the org is not entitled to.
 *
 * ── FAIL-OPEN (deliberate) ────────────────────────────────────────────────
 * When the entitlement lookup itself fails (Supabase error / unreadable
 * billing state) this middleware logs the failure and ALLOWS the request.
 *
 * Rationale: the enforcement data lives in a mirror of Stripe that can be
 * temporarily unreadable or lagging. Failing closed on an infrastructure
 * blip would lock paying customers out of modules they have paid for — a
 * worse business outcome, and an availability/denial-of-service hazard, than
 * briefly over-serving a tenant. Access is still bounded by authentication,
 * org-access, and RBAC; only the *billing plan* boundary is temporarily
 * relaxed. The failure is logged at error level so it is observable and
 * alertable, and the next successful resolution re-enforces.
 *
 * Trusted bypasses mirror `requirePermission`:
 *  - super_admin profiles
 *  - any approved membership with an admin/super_admin role key (platform
 *    admins operating cross-tenant)
 * These bypass the *plan* gate intentionally so MSP staff can provision and
 * support tenants that are between subscriptions.
 *
 * Returns 402 PAYMENT_REQUIRED (RFC 9110 / Stripe convention for a missing
 * paid entitlement) with an explicit error envelope. The portal can key on
 * this code to prompt an upgrade.
 */
import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../types";
import { logger } from "../lib/logger";
import { resolveEffectivePermissions, ADMIN_BYPASS_KEYS } from "../lib/permissions";
import { resolveOrgEntitlements, GATED_MODULES } from "../lib/entitlements";

/**
 * Short-lived, per-process cache of resolved entitlements. Billing state
 * changes infrequently; a small TTL avoids a Supabase round-trip on every
 * request to a gated module while still converging quickly. Cache misses and
 * failures are not cached.
 */
const ENTITLEMENT_TTL_MS = 30_000;
const entitlementCache = new Map<string, { result: EntitlementsResult; expires: number }>();

type EntitlementsResult =
  | { ok: true; enabledModules: string[]; subscriptionActive: boolean }
  | { ok: false };

function isAdminBypassRole(roleKey: string | null | undefined): boolean {
  return roleKey != null && (ADMIN_BYPASS_KEYS as readonly string[]).includes(roleKey);
}

function extractOrgId(req: Request): string | null {
  if (req.query.organization_id) return req.query.organization_id as string;
  if (req.body?.organizationId) return req.body.organizationId as string;

  const header = req.headers?.["x-active-org"];
  if (typeof header === "string" && header.length > 0) return header;

  const cookieOrg = (req.cookies as Record<string, string> | undefined)?.["mct_active_org"];
  if (typeof cookieOrg === "string" && cookieOrg.length > 0) return cookieOrg;

  const scopedOrg = (req as Request & { orgId?: string | null }).orgId;
  if (typeof scopedOrg === "string" && scopedOrg.length > 0) return scopedOrg;

  return null;
}

async function resolveForOrg(orgId: string): Promise<EntitlementsResult> {
  const cached = entitlementCache.get(orgId);
  if (cached && cached.expires > Date.now()) return cached.result;

  try {
    const resolved = await resolveOrgEntitlements(orgId);
    const result: EntitlementsResult = {
      ok: true,
      enabledModules: resolved.enabledModules,
      subscriptionActive: resolved.subscriptionActive,
    };
    entitlementCache.set(orgId, { result, expires: Date.now() + ENTITLEMENT_TTL_MS });
    return result;
  } catch (err) {
    logger.error(
      { err, orgId },
      "Entitlement resolution failed; failing open (allow) for plan-boundary check",
    );
    return { ok: false };
  }
}

/** Test-only hook to clear the in-memory entitlement cache. */
export function clearEntitlementCache(): void {
  entitlementCache.clear();
}

async function enforce(
  req: Request,
  predicate: (result: Extract<EntitlementsResult, { ok: true }>) => boolean,
  moduleKey: string,
): Promise<void> {
  if (!req.authUser) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  const orgId = extractOrgId(req);
  if (!orgId) {
    // No resolvable org means requireOrgAccess should have already rejected
    // the request. If we reach here with no org we cannot evaluate plan
    // boundaries; fail open to avoid breaking un-org-scoped admin reads.
    logger.warn({ moduleKey }, "Entitlement check skipped: no organization resolved");
    return;
  }

  // Platform-admin / super-admin bypass (matches requirePermission).
  const resolved = await resolveEffectivePermissions(req.authUser.userId, orgId);
  if (resolved.isSuperAdmin || resolved.roles.some(isAdminBypassRole)) return;

  const result = await resolveForOrg(orgId);
  if (!result.ok) return; // fail-open (see module docstring)

  if (!predicate(result)) {
    throw new AppError(
      "PAYMENT_REQUIRED",
      "An active subscription is required to access this module",
      402,
      { moduleKey, reason: "entitlement" },
    );
  }
}

/**
 * Require the org to be entitled to `moduleKey`. Gated modules additionally
 * require an active/trialing subscription unless explicitly provisioned by an
 * MSP admin; default (free) modules always pass.
 */
export function requireEntitlement(moduleKey: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await enforce(
        req,
        (result) => {
          if (result.enabledModules.includes(moduleKey)) return true;
          // A gated module is denied only when the subscription is inactive
          // AND the admin entitlement list does not grant it.
          return !GATED_MODULES.includes(moduleKey);
        },
        moduleKey,
      );
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Require an active or trialing subscription for the resolved org. */
export function requireActiveSubscription() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await enforce(req, (result) => result.subscriptionActive, "subscription");
      next();
    } catch (error) {
      next(error);
    }
  };
}
