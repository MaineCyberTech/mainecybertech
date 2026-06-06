"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";

export async function updateOrganizationBasics(formData: FormData) {
  const api = getApiClient();

  const organizationId = String(formData.get("organizationId"));
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const status = String(formData.get("status") ?? "pending");
  const primaryDomain = String(formData.get("primaryDomain") ?? "").trim().toLowerCase();
  const supportPlan = String(formData.get("supportPlan") ?? "").trim();

  await api.organizations.update(organizationId, {
    name,
    slug,
    status,
    primaryDomain: primaryDomain || null,
    supportPlan: supportPlan || null,
  });

  revalidatePath(`/admin/organizations/${organizationId}`);
  revalidatePath(`/admin/organizations/${organizationId}/activity`);
  revalidatePath("/admin/organizations");
  revalidatePath("/admin/audit");
}

export async function createOrganizationDomain(formData: FormData) {
  const api = getApiClient();

  const organizationId = String(formData.get("organizationId"));
  const domain = String(formData.get("domain") ?? "").trim().toLowerCase();
  const autoApprove = String(formData.get("autoApprove") ?? "false") === "true";

  if (!domain) return;

  await api.organizations.addDomain(organizationId, { domain, autoApprove });

  revalidatePath(`/admin/organizations/${organizationId}`);
  revalidatePath(`/admin/organizations/${organizationId}/activity`);
  revalidatePath("/admin/audit");
}

export async function updateOrganizationDomain(formData: FormData) {
  const api = getApiClient();

  const organizationId = String(formData.get("organizationId"));
  const domainId = String(formData.get("domainId"));
  const autoApprove = String(formData.get("autoApprove") ?? "false") === "true";

  await api.organizations.updateDomain(organizationId, domainId, { autoApprove });

  revalidatePath(`/admin/organizations/${organizationId}`);
  revalidatePath(`/admin/organizations/${organizationId}/activity`);
  revalidatePath("/admin/audit");
}

export async function uploadOrgDocument(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const api = getApiClient();
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || undefined;
  const file = formData.get("file");

  if (!organizationId) return { ok: false, error: "Organization ID is required." };
  if (!title) return { ok: false, error: "Document title is required." };
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Select a file to upload." };

  try {
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    await api.documents.upload({ file: blob, organizationId, name: title, description, visibility: "org", bucket: "documents" });
    revalidatePath(`/admin/organizations/${organizationId}`);
    revalidatePath("/admin/documents");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}
