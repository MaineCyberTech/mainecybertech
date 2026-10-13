"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { formErrorMessage } from "@/lib/api-error";
import { getApprovedMembership } from "@/lib/auth/membership";

/**
 * USE-P3-001: the live portal ticket-create action.
 *
 * Reads the same `subject` field the support form submits (it previously read
 * a `title` field nothing sent, while the live inline action lived in
 * page.tsx), and returns the created ticket so the caller can confirm success
 * with a link instead of only closing the modal.
 */
export async function createPortalTicket(formData: FormData) {
  try {
    const api = getApiClient();
    const membership = await getApprovedMembership();

    if (!membership?.organization_id) {
      return { ok: false as const, error: "No approved organization membership found." };
    }

    const subject = String(formData.get("subject") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const priority = String(formData.get("priority") ?? "normal").trim();
    const category = String(formData.get("category") ?? "").trim();

    if (!subject) {
      return { ok: false as const, error: "Title is required." };
    }

    const ticket = await api.tickets.create({
      organizationId: membership.organization_id,
      title: subject,
      description: description || null,
      priority,
      category: category || null,
      source: "portal",
    });

    revalidatePath("/portal/support");
    return { ok: true as const, ticketId: ticket.id, subject: ticket.title ?? subject };
  } catch (error) {
    return { ok: false as const, error: formErrorMessage(error, "Could not create the ticket.") };
  }
}
