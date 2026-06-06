"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";

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

export async function approveMembership(formData: FormData) {
  const api = getApiClient();
  const membershipId = String(formData.get("membershipId"));

  await api.memberships.update(membershipId, {
    roleId: "",
    status: "approved",
  });

  revalidatePath("/admin/approvals");
  revalidatePath("/admin/audit");
}

export async function rejectMembership(formData: FormData) {
  const api = getApiClient();
  const membershipId = String(formData.get("membershipId"));

  await api.memberships.update(membershipId, {
    roleId: "",
    status: "rejected",
  });

  revalidatePath("/admin/approvals");
  revalidatePath("/admin/audit");
}
