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
  } catch {
    redirect("/login");
  }

  if (!user?.userId) {
    redirect("/login");
  }

  let memberships;
  try {
    memberships = await api.memberships.list({ userId: user.userId, status: "approved" });
  } catch {
    redirect("/portal/dashboard");
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
