"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export type ProposalDecisionResult = { ok: boolean; error?: string };

export async function decideProposalAction(
  proposalId: string,
  decision: "accepted" | "declined",
  notes: string,
): Promise<ProposalDecisionResult> {
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) {
    return { ok: false, error: "No approved organization membership." };
  }

  try {
    await getApiClient().proposals.clientDecision(proposalId, {
      organizationId: membership.organization_id,
      decision,
      notes: notes.trim() || null,
    });
    revalidatePath(`/portal/proposals/${proposalId}`);
    revalidatePath("/portal/proposals");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not record your decision.",
    };
  }
}
