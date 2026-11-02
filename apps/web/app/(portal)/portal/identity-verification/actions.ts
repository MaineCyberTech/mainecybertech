"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function requestIdentityVerificationAction(formData: FormData): Promise<void> {
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) throw new Error("No approved organization membership.");

  const requestorName = String(formData.get("requestorName") ?? "").trim();
  if (!requestorName) throw new Error("Requestor name is required.");

  try {
    await getApiClient().securitySuite.idVerify.create({
      organizationId: membership.organization_id,
      requestorName,
      requestorEmail: String(formData.get("requestorEmail") ?? "").trim() || null,
      verificationMethod: String(formData.get("verificationMethod") ?? "callback"),
      actionAuthorized: String(formData.get("actionAuthorized") ?? "").trim() || null,
    });
    revalidatePath("/portal/identity-verification");
    redirect("/portal/identity-verification");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    throw error;
  }
}
