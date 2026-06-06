"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function uploadPortalDocument(formData: FormData): Promise<{ ok: boolean; error?: string; document?: any }> {
  const api = getApiClient();
  const membership = await getApprovedMembership();

  if (!membership?.organization_id) {
    return { ok: false, error: "No approved organization membership found." };
  }

  const title = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!title) {
    return { ok: false, error: "Title is required." };
  }

  if (!file || file.size === 0) {
    return { ok: false, error: "A file is required." };
  }

  try {
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    const doc = await api.documents.upload({
      file: blob,
      organizationId: membership.organization_id,
      name: title,
      description: description || null,
      visibility: "org",
    });
    revalidatePath("/portal/documents");
    return { ok: true, document: doc };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Upload failed" };
  }
}
