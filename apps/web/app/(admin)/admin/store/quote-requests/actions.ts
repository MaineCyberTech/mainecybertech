"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";

export type ProposalDraftActionResult = {
  ok: boolean;
  error?: string;
  draftId?: string;
};

export async function generateProposalDraftAction(
  formData: FormData,
): Promise<ProposalDraftActionResult> {
  try {
    await requireAdminAccess();
    const quoteRequestId = String(formData.get("quoteRequestId") ?? "").trim();
    if (!quoteRequestId) return { ok: false, error: "Missing quote request id." };

    const draft = await getApiClient().store.generateProposalDraft(quoteRequestId);

    revalidatePath("/admin/store/quote-requests");
    return { ok: true, draftId: draft.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected error.",
    };
  }
}

export async function updateProposalDraftStatusAction(
  formData: FormData,
): Promise<ProposalDraftActionResult> {
  try {
    await requireAdminAccess();
    const draftId = String(formData.get("draftId") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    if (!draftId || !status) return { ok: false, error: "Missing draft id or status." };

    await getApiClient().store.updateProposalDraft(draftId, {
      status: status as "draft_internal" | "in_review" | "approved" | "sent" | "archived",
    });

    revalidatePath("/admin/store/quote-requests");
    return { ok: true, draftId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected error.",
    };
  }
}
