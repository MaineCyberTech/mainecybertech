import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { isPlatformAdminKey } from "@/lib/roles";

type AdminAccessResult = {
  userId: string;
  roleKey: string;
};

export async function requireAdminAccess(): Promise<AdminAccessResult> {
  const api = getApiClient();

  let user;
  try {
    user = await api.users.me();
  } catch (error) {
    const err = error as { code?: string; status?: number };
    if (err?.code === "MFA_REQUIRED") redirect("/portal/profile/security?mfa=required");
    if (err?.status === 401 || err?.status === 403) redirect("/login");
    throw error;
  }

  if (!user?.userId) {
    redirect("/login");
  }

  let memberships;
  try {
    memberships = await api.memberships.list({ userId: user.userId, status: "approved" });
  } catch (error) {
    const status = (error as { status?: number })?.status;
    if (status === 401 || status === 403) redirect("/portal/dashboard");
    throw error;
  }

  if (!memberships.length) {
    redirect("/portal/dashboard");
  }

  const adminMembership = memberships.find((m) => {
    const role = m.roles;
    return role && isPlatformAdminKey(role.key);
  });

  if (!adminMembership) {
    redirect("/portal/dashboard");
  }

  return {
    userId: user.userId,
    roleKey: adminMembership.roles?.key ?? "",
  };
}
