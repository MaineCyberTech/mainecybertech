"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";

export type ConvertIntakeResult = {
  ok: boolean;
  error?: string;
  projectId?: string;
  ticketId?: string;
  checklistTaskCount?: number;
};

/**
 * Intake → project handoff: creates the project, its fulfilment checklist and a
 * handoff ticket from a store quote request, then flips the source rows.
 */
export async function convertIntakeToProject(
  quoteRequestId: string,
  formData: FormData,
): Promise<ConvertIntakeResult> {
  try {
    await requireAdminAccess();

    const organizationId = String(formData.get("organizationId") ?? "").trim();
    if (!organizationId) return { ok: false, error: "Organization ID is required." };

    const projectName = String(formData.get("projectName") ?? "").trim();
    const priority = String(formData.get("priority") ?? "normal").trim();

    const result = await getApiClient().store.convertQuoteRequest(quoteRequestId, {
      organizationId,
      projectName: projectName || undefined,
      priority: priority as "low" | "normal" | "high" | "urgent",
    });

    revalidatePath("/admin/store/operations");
    revalidatePath("/admin/store/quote-requests");

    return {
      ok: true,
      projectId: result.project?.id,
      ticketId: result.ticketId,
      checklistTaskCount: result.checklistTaskCount,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }
}
