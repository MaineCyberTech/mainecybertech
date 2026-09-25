"use server";
export async function generateProposal(
  quoteId: string,
): Promise<{ ok: boolean; error?: string; proposalUrl?: string }> {
  return { ok: true, proposalUrl: `/admin/store/proposals/${quoteId}` };
}
