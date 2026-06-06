"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function createPortalTicket(formData: FormData) {
  const api = getApiClient();
  const membership = await getApprovedMembership();

  if (!membership?.organization_id) {
    throw new Error("No approved organization membership found.");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "normal");
  const category = String(formData.get("category") ?? "").trim();

  if (!title) {
    throw new Error("Title is required.");
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
}
