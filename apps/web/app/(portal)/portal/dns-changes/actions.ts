"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function createDnsChangeAction(formData: FormData): Promise<void> {
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) throw new Error("No approved organization.");

  const domain = String(formData.get("domain") ?? "").trim();
  if (!domain) throw new Error("Domain is required.");

  try {
    await getApiClient().final.dnsChanges.create({
      organizationId: membership.organization_id,
      domain,
      changeType: String(formData.get("changeType") ?? "a"),
      changeDescription: String(formData.get("changeDescription") ?? "").trim() || null,
      proposedValue: String(formData.get("proposedValue") ?? "").trim() || null,
      currentValue: String(formData.get("currentValue") ?? "").trim() || null,
    });
    revalidatePath("/portal/dns-changes");
    redirect("/portal/dns-changes");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    throw error;
  }
}
