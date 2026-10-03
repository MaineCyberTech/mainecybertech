"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function addPortalTicketComment(formData: FormData) {
  try {
    const api = getApiClient();
    const membership = await getApprovedMembership();

    if (!membership?.organization_id) {
      return { ok: false as const, error: "No approved organization membership found." };
    }

    const ticketId = String(formData.get("ticketId") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();

    if (!ticketId || !body) {
      return { ok: false as const, error: "Ticket ID and comment body are required." };
    }

    await api.tickets.addComment(ticketId, {
      organizationId: membership.organization_id,
      body,
      isInternal: false,
    });

    revalidatePath(`/portal/support/${ticketId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
