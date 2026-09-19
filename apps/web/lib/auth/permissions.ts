import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import type { MyPermissionsResponse } from "@mct/sdk";

/**
 * Server-side page guard: redirects unauthenticated users to /login
 * and authenticated users lacking `module:action` to /forbidden.
 * Super admins always pass.
 */
export async function requirePermission(
  moduleKey: string,
  actionKey = "view",
): Promise<MyPermissionsResponse> {
  const api = getApiClient();

  let permissions: MyPermissionsResponse;
  try {
    permissions = await api.permissions.getMyPermissions();
  } catch {
    redirect("/login");
  }

  if (permissions.isSuperAdmin) return permissions;

  if (!hasPermission(permissions.keys, moduleKey, actionKey)) {
    redirect("/forbidden");
  }

  return permissions;
}
