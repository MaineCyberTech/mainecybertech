"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function createDnsChangeAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) {
    return { ok: false, error: "No approved organization." };
  }

  const domain = String(formData.get("domain") ?? "").trim();
  if (!domain) return { ok: false, error: "Domain is required." };

  try {
    await getApiClient().final.dnsChanges.create({
      organizationId: membership.organization_id,
      domain,
      changeType: String(formData.get("changeType") ?? "a"),
      changeDescription: String(formData.get("changeDescription") ?? "").trim() || null,
      proposedValue: String(formData.get("proposedValue") ?? "").trim() || null,
      currentValue: String(formData.get("currentValue") ?? "").trim() || null,
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create DNS change request",
    };
  }

  revalidatePath("/portal/dns-changes");
  redirect("/portal/dns-changes");
}
