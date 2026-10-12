"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { Membership } from "@mct/sdk";

export async function updateUserProfileBasics(formData: FormData) {
  const api = getApiClient();

  const userId = String(formData.get("userId"));
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  await api.profiles.update(userId, {
    fullName: fullName || null,
    phone: phone || null,
    title: title || null,
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath(`/admin/users/${userId}/activity`);
  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
}

export type UpdateMembershipResult = { ok: true } | { ok: false; error: string };

export async function updateMembership(formData: FormData): Promise<UpdateMembershipResult> {
  const api = getApiClient();

  const membershipId = String(formData.get("membershipId"));
  const userId = String(formData.get("userId"));
  const roleId = String(formData.get("roleId"));
  const status = String(formData.get("status"));
  const isBillingContact = formData.get("isBillingContact") === "on";
  const isSecurityContact = formData.get("isSecurityContact") === "on";

  // USE-P2-010: return the failure instead of throwing into the route error
  // boundary so the client can render it (and a success message) inline.
  try {
    await api.memberships.update(membershipId, {
      roleId,
      status,
      isBillingContact,
      isSecurityContact,
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath(`/admin/users/${userId}/activity`);
  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");

  try {
    const memberships = await api.memberships.list({}) as Membership[];
    const membership = memberships.find((m) => m.id === membershipId);
    if (membership?.organization_id) {
      revalidatePath(`/admin/organizations/${membership.organization_id}`);
      revalidatePath(`/admin/organizations/${membership.organization_id}/activity`);
    }
  } catch {
    // revalidation of org pages is best-effort
  }

  return { ok: true };
}
