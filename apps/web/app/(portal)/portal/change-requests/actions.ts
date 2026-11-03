"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function createChangeRequestAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) {
    return { ok: false, error: "No approved organization." };
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Title is required." };

  let created: { id: string };
  try {
    created = (await getApiClient().governance.changes.create({
      organizationId: membership.organization_id,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      changeType: String(formData.get("changeType") ?? "standard"),
      riskLevel: String(formData.get("riskLevel") ?? "low"),
      rollbackPlan: String(formData.get("rollbackPlan") ?? "").trim() || null,
      implementationDate: String(formData.get("implementationDate") ?? "").trim() || null,
      verificationSteps: String(formData.get("verificationSteps") ?? "").trim() || null,
    })) as { id: string };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create change request",
    };
  }

  // Redirect outside the try/catch so NEXT_REDIRECT is never converted into an
  // inline error (USE-P2-007 / USE-P3-008).
  revalidatePath("/portal/change-requests");
  redirect(`/portal/change-requests/${created.id}`);
}

export type ChangeActionResult = { ok: boolean; error?: string };

export async function submitChangeRequestAction(id: string): Promise<ChangeActionResult> {
  try {
    await getApiClient().governance.changes.submit(id, {});
    revalidatePath(`/portal/change-requests/${id}`);
    revalidatePath("/portal/change-requests");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to submit" };
  }
}
