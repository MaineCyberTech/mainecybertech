"use server";

import { revalidatePath } from "next/cache";
import { createIntakeTicket, getAlgaPsaIntakeConfig } from "@/lib/alga-psa";
import { getApiClient } from "@/lib/api";
import { formErrorMessage } from "@/lib/api-error";
import { getApprovedMembership } from "@/lib/auth/membership";

const ALGA_INTAKE_ERROR =
  "We couldn't submit your ticket to our service desk. No ticket was created. " +
  "Please try again, or email support@mainecybertech.com.";

/**
 * USE-P3-001: the live portal ticket-create action.
 *
 * Reads the same `subject` field the support form submits (it previously read
 * a `title` field nothing sent, while the live inline action lived in
 * page.tsx), and returns the created ticket so the caller can confirm success
 * with a link instead of only closing the modal.
 *
 * ADR 0001: when the Alga PSA intake flag is enabled and configured for this
 * portal organization, the ticket is created in the PSA instead of Supabase.
 * The two paths are exclusive — a failed PSA create returns an error and never
 * falls back to a second write in Supabase.
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

    const algaConfig = getAlgaPsaIntakeConfig(membership.organization_id);
    if (algaConfig) {
      try {
        const algaTicket = await createIntakeTicket({
          config: algaConfig,
          title: subject,
          description: description || null,
          portalOrganizationId: membership.organization_id,
          portalPriority: priority,
          portalCategory: category || null,
          portalBaseUrl: process.env.APP_BASE_URL,
        });

        // The PSA ticket already exists. A cache-refresh failure must not turn
        // a successful create into an error the user retries (and duplicates).
        try {
          revalidatePath("/portal/support");
        } catch {
          // Best effort only.
        }
        // A PSA ticket id is not a portal ticket id. Returning an empty id
        // suppresses the portal detail link rather than linking to a record
        // that only exists in the PSA.
        return { ok: true as const, ticketId: "", subject: algaTicket.title ?? subject };
      } catch {
        return { ok: false as const, error: ALGA_INTAKE_ERROR };
      }
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
