"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function createPortalTicket(formData: FormData) {
  try {
    const api = getApiClient();
    const membership = await getApprovedMembership();

    if (!membership?.organization_id) {
      return { ok: false as const, error: "No approved organization membership found." };
    }

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const priority = String(formData.get("priority") ?? "normal");
    const category = String(formData.get("category") ?? "").trim();

    if (!title) {
      return { ok: false as const, error: "Title is required." };
    }

    await api.tickets.create({
      organizationId: membership.organization_id,
      title,
      description: description || null,
      priority,
      category: category || null,
      source: "portal",
    });

    revalidatePath("/portal/support");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
