"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function requestOffboardingAction(formData: FormData): Promise<void> {
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) throw new Error("No approved organization membership.");

  const employeeName = String(formData.get("employeeName") ?? "").trim();
  if (!employeeName) throw new Error("Employee name is required.");

  try {
    await getApiClient().securityOps.offboarding.create({
      organizationId: membership.organization_id,
      employeeName,
      employeeEmail: String(formData.get("employeeEmail") ?? "").trim() || null,
      department: String(formData.get("department") ?? "").trim() || null,
      offboardingDate: String(formData.get("offboardingDate") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    });
    revalidatePath("/portal/offboarding");
    redirect("/portal/offboarding");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    throw error;
  }
}
