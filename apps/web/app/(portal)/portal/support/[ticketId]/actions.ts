"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function addPortalTicketComment(formData: FormData) {
  const api = getApiClient();
  const membership = await getApprovedMembership();

  if (!membership?.organization_id) {
    throw new Error("No approved organization membership found.");
  }

  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!ticketId || !body) {
    throw new Error("Ticket ID and comment body are required.");
  }

  await api.tickets.addComment(ticketId, {
    organizationId: membership.organization_id,
    body,
    isInternal: false,
  });

  revalidatePath(`/portal/support/${ticketId}`);
}
