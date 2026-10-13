"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Membership } from "@mct/sdk";
import { getApiClient } from "@/lib/api";

const ORG_COOKIE = "mct_active_org";

/** Typed result so callers can surface a failed authorization instead of a silent no-op. */
export type SetActiveOrgResult = { ok: true } | { ok: false; error: string };

/**
 * Persist the caller's active organization.
 *
 * SEC-P3-011 / ADMIN-P3-002: the cookie is a server-trusted scope selector for
 * every subsequent portal request, so it must be authorized here rather than
 * written blindly from a client-supplied id. The caller must hold an approved
 * membership in the target org; platform admins (admin/super_admin) may switch
 * into any tenant by design, matching the API's `requireOrgAccess` semantics.
 */
export async function setActiveOrg(organizationId: string): Promise<SetActiveOrgResult> {
  if (!organizationId) return { ok: false, error: "Organization is required" };

  let memberships: Membership[] = [];
  try {
    memberships = await getApiClient().memberships.mine();
  } catch {
    return { ok: false, error: "Unable to verify organization access. Please try again." };
  }

  const approved = memberships.filter((m) => m.status === "approved");
  const isMember = approved.some((m) => m.organization_id === organizationId);
  const isPlatformAdmin = approved.some(
    (m) => m.roles?.key === "admin" || m.roles?.key === "super_admin",
  );
  if (!isMember && !isPlatformAdmin) {
    return { ok: false, error: "You do not have access to this organization" };
  }

  const cookieStore = await cookies();
  cookieStore.set(ORG_COOKIE, organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function getActiveOrg(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ORG_COOKIE)?.value ?? null;
}
