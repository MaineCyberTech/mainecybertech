"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";

/**
 * FEAT-P3-009: approve/reject an AI draft through the one-way review gate.
 * The API records the reviewer identity and timestamp; the caller only chooses
 * the decision and optional notes.
 */
export async function reviewAiDraftAction(
  id: string,
  organizationId: string,
  decision: "approved" | "rejected",
  reviewNotes?: string | null,
) {
  const api = getApiClient();
  if (!id || !organizationId || (decision !== "approved" && decision !== "rejected")) {
    return { ok: false as const, error: "Invalid review request" };
  }

  try {
    await api.ai.drafts.review(id, organizationId, {
      decision,
      reviewNotes: reviewNotes?.trim() || null,
    });
    revalidatePath("/admin/ai/drafts");
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to review the draft",
    };
  }
}
