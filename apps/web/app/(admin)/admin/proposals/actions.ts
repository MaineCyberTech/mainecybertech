"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";

export async function createProposalAction(formData: FormData) {
  const api = getApiClient();
  const organizationId = String(formData.get("organizationId") || "");
  try {
    const created = await api.proposals.create({
      organizationId,
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || "") || null,
      validUntil: String(formData.get("validUntil") || "") || null,
      visibility: String(formData.get("visibility") || "internal"),
      phases: [],
    });
    revalidatePath("/admin/proposals");
    redirect(`/admin/proposals/${created.id}`);
  } catch (e: unknown) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to create" };
  }
}

export async function updateProposalAction(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    const data: {
      title: string;
      visibility: string;
      description?: string;
      status?: string;
      validUntil?: string;
    } = {
      title: String(formData.get("title") || ""),
      visibility: String(formData.get("visibility") || "internal"),
    };
    const description = String(formData.get("description") || "");
    if (description) data.description = description;
    const status = String(formData.get("status") || "");
    if (status) data.status = status;
    const validUntil = String(formData.get("validUntil") || "");
    if (validUntil) data.validUntil = validUntil;
    await api.proposals.update(id, data);
    revalidatePath(`/admin/proposals/${id}`);
    return { ok: true as const };
  } catch (e: unknown) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to update" };
  }
}
