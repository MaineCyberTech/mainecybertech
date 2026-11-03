"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function requestIdentityVerificationAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) {
    return { ok: false, error: "No approved organization membership." };
  }

  const requestorName = String(formData.get("requestorName") ?? "").trim();
  if (!requestorName) return { ok: false, error: "Requestor name is required." };

  try {
    await getApiClient().securitySuite.idVerify.create({
      organizationId: membership.organization_id,
      requestorName,
      requestorEmail: String(formData.get("requestorEmail") ?? "").trim() || null,
      verificationMethod: String(formData.get("verificationMethod") ?? "callback"),
      actionAuthorized: String(formData.get("actionAuthorized") ?? "").trim() || null,
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to request identity verification",
    };
  }

  revalidatePath("/portal/identity-verification");
  redirect("/portal/identity-verification");
}
