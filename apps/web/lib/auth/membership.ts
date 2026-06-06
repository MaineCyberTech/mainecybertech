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
    let membership: any;

    if (activeOrgId) {
      membership = memberships.find((m: any) => m.organization_id === activeOrgId);
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
    };
  } catch (err) {
    console.error("membership lookup error", err);
    return null;
  }
}
