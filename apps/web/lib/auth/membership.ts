import { getApiClient } from "@/lib/api";
import { getActiveOrg } from "@/lib/org-actions";

export async function getApprovedMembership() {
  const api = getApiClient();
  let user;
  try {
    user = await api.users.me();
  } catch {
    return null;
  }

  if (!user?.userId) return null;

  try {
    const memberships = await api.memberships.list({ userId: user.userId, status: "approved" });
    if (!memberships.length) return null;

    const activeOrgId = await getActiveOrg();

    // Platform admins (admin/super_admin in any org) can switch into any
    // tenant — honor the active org cookie even without a membership there.
    const isPlatformAdmin = (memberships as any[]).some((m) => {
      const key = m.roles?.key;
      return key === "admin" || key === "super_admin";
    });

    let membership: any;

    if (activeOrgId) {
      membership = memberships.find((m: any) => m.organization_id === activeOrgId);
      if (!membership && isPlatformAdmin) {
        membership = {
          id: `adhoc-${activeOrgId}`,
          status: "approved",
          organization_id: activeOrgId,
          role_id: null,
          organizations: null,
          isPlatformAdmin: true,
        };
      }
    }

    if (!membership) {
      membership = memberships[0];
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
    console.error("membership lookup error", err);
    return null;
  }
}
