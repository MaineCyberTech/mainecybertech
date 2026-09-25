"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function createArticle(formData: FormData): Promise<void> {
  const api = getApiClient();
  const membership = await getApprovedMembership();

  if (!membership?.organization_id) return;

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  if (!title || !body) return;

  try {
    await api.knowledgeBase.create({
      organizationId: membership.organization_id,
      title,
      body,
      category: category || null,
      isPublished: true,
    });
    revalidatePath("/portal/client-knowledge-base");
  } catch {
    // Form action has no UI surface for the error; the list simply won't update.
  }
}
