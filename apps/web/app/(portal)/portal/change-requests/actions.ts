"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function createChangeRequestAction(formData: FormData): Promise<void> {
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) throw new Error("No approved organization.");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Title is required.");

  try {
    const created = (await getApiClient().governance.changes.create({
      organizationId: membership.organization_id,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      changeType: String(formData.get("changeType") ?? "standard"),
      riskLevel: String(formData.get("riskLevel") ?? "low"),
      rollbackPlan: String(formData.get("rollbackPlan") ?? "").trim() || null,
      implementationDate: String(formData.get("implementationDate") ?? "").trim() || null,
      verificationSteps: String(formData.get("verificationSteps") ?? "").trim() || null,
    })) as { id: string };

    revalidatePath("/portal/change-requests");
    redirect(`/portal/change-requests/${created.id}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    throw error;
  }
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
