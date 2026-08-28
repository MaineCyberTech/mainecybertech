"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function createArticle(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const api = getApiClient();
  const membership = await getApprovedMembership();

  if (!membership?.organization_id) {
    return { ok: false, error: "No approved organization membership found." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  if (!title || !body) {
    return { ok: false, error: "Title and body are required." };
  }

  try {
    await api.knowledgeBase.create({
      organizationId: membership.organization_id,
      title,
      body,
      category: category || null,
      isPublished: true,
    });
    revalidatePath("/portal/client-knowledge-base");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Create failed" };
  }
}
