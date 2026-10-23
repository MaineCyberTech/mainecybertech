"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function addInsuranceEvidenceAction(formData: FormData): Promise<void> {
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) throw new Error("No approved organization membership.");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Title is required.");

  try {
    await getApiClient().insuranceBinder.create({
      organizationId: membership.organization_id,
      title,
      coverageArea: String(formData.get("coverageArea") ?? "").trim() || null,
      insuranceProvider: String(formData.get("insuranceProvider") ?? "").trim() || null,
      policyNumber: String(formData.get("policyNumber") ?? "").trim() || null,
      expiryDate: String(formData.get("expiryDate") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      status: "pending",
    });
    revalidatePath("/portal/insurance-binder");
    redirect("/portal/insurance-binder");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    throw error;
  }
}
