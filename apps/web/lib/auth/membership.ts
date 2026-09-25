import { cache } from "react";
import { getApiClient } from "@/lib/api";
import { getActiveOrg } from "@/lib/org-actions";
import { withRetry } from "@/lib/retry";
import type { Membership, Organization } from "@mct/sdk";

type ResolvedMembership = {
  id: string;
  status: string;
  organization_id: string;
  role_id: string | null;
  organizations?: Organization | null;
  isPlatformAdmin: boolean;
};

/** True for auth failures (treated as "no membership") vs transient errors. */
function isAuthError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return status === 401 || status === 403;
}

async function loadApprovedMembership(): Promise<ResolvedMembership | null> {
  const api = getApiClient();
  let user;
  try {
    // The SDK retries 429/502/503/504 but not 500, so absorb transient 500s.
    user = await withRetry(() => api.users.me());
  } catch (err) {
    if (isAuthError(err)) return null;
    // Transient failure: let the route-group error.tsx render instead of
    // bouncing the user to /pending as if they had no membership.
    throw err;
  }

  if (!user?.userId) return null;

  try {
    const memberships = await withRetry(() =>
      api.memberships.list({ userId: user.userId, status: "approved" }),
    );
    if (!memberships.length) return null;

    const activeOrgId = await getActiveOrg();

    // Platform admins (admin/super_admin in any org) can switch into any
    // tenant — honor the active org cookie even without a membership there.
    const isPlatformAdmin = memberships.some((m) => {
      const key = m.roles?.key;
      return key === "admin" || key === "super_admin";
    });

    const toResolved = (m: Membership): ResolvedMembership => ({
      id: m.id,
      status: m.status,
      organization_id: m.organization_id,
      role_id: m.role_id,
      organizations: m.organizations ?? null,
      isPlatformAdmin: m.roles?.key === "admin" || m.roles?.key === "super_admin",
    });

    const found = activeOrgId
      ? memberships.find((m) => m.organization_id === activeOrgId)
      : undefined;

    let membership: ResolvedMembership;
    if (found) {
      membership = toResolved(found);
    } else if (activeOrgId && isPlatformAdmin) {
      membership = {
        id: `adhoc-${activeOrgId}`,
        status: "approved",
        organization_id: activeOrgId,
        role_id: null,
        organizations: null,
        isPlatformAdmin: true,
      };
    } else {
      membership = memberships[0]
        ? toResolved(memberships[0])
        : {
            id: "",
            status: "",
            organization_id: "",
            role_id: null,
            organizations: null,
            isPlatformAdmin: false,
          };
    }

    return {
      id: membership.id,
      status: membership.status,
      organization_id: membership.organization_id,
      role_id: membership.role_id,
      organizations: membership.organizations ?? null,
      isPlatformAdmin: membership.isPlatformAdmin === true || isPlatformAdmin,
    };
  } catch (err) {
    if (isAuthError(err)) return null;
    throw err;
  }
}

/**
 * Memoized per request: the portal layout and each page call this, so
 * without `cache()` every page render repeats the me()+memberships calls.
 */
export const getApprovedMembership = cache(loadApprovedMembership);
