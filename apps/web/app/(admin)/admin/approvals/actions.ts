"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";

export type MembershipApprovalResult = {
  ok: boolean;
  error?: string;
};

export async function approveOrganization(formData: FormData) {
  const api = getApiClient();
  const organizationId = String(formData.get("organizationId"));

  await api.organizations.update(organizationId, { status: "approved" });

  revalidatePath("/admin/approvals");
  revalidatePath(`/admin/organizations/${organizationId}`);
  revalidatePath("/admin/audit");
}

export async function rejectOrganization(formData: FormData) {
  const api = getApiClient();
  const organizationId = String(formData.get("organizationId"));

  await api.organizations.update(organizationId, { status: "rejected" });

  revalidatePath("/admin/approvals");
  revalidatePath(`/admin/organizations/${organizationId}`);
  revalidatePath("/admin/audit");
}

/**
 * Status-only membership transitions. The membership already has a role, so
 * the queue must NOT send `roleId: ""` — that fails UUID validation and left
 * every pending user unapprovable (USE-P1-003). Errors are returned so the
 * client component can display the API message instead of throwing into an
 * error boundary.
 */
export async function approveMembership(formData: FormData): Promise<MembershipApprovalResult> {
  const membershipId = String(formData.get("membershipId"));

  try {
    await getApiClient().memberships.update(membershipId, { status: "approved" });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }

  revalidatePath("/admin/approvals");
  revalidatePath("/admin/audit");
  return { ok: true };
}

export async function rejectMembership(formData: FormData): Promise<MembershipApprovalResult> {
  const membershipId = String(formData.get("membershipId"));

  try {
    await getApiClient().memberships.update(membershipId, { status: "rejected" });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }

  revalidatePath("/admin/approvals");
  revalidatePath("/admin/audit");
  return { ok: true };
}
