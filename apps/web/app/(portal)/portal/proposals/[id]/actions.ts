"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";

export async function submitProposalAction(formData: FormData) {
  try {
    const api = getApiClient();
    const proposalId = String(formData.get("proposalId") ?? "").trim();
    const organizationId = String(formData.get("organizationId") ?? "").trim();
    if (!proposalId || !organizationId)
      return { ok: false as const, error: "Proposal ID and organization are required." };

    await api.proposals.submitForApproval(proposalId, { organizationId });
    revalidatePath(`/portal/proposals/${proposalId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
