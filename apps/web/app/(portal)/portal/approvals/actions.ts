"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

async function orgId(): Promise<string | null> {
  const membership = await getApprovedMembership();
  return membership?.organization_id ?? null;
}

export async function createApprovalAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const organizationId = await orgId();
  if (!organizationId) {
    return { ok: false, error: "No approved organization membership." };
  }

  const subject = String(formData.get("requestSubject") ?? "").trim();
  if (!subject) return { ok: false, error: "Subject is required." };

  let created: { id: string };
  try {
    created = await getApiClient().approvals.create({
      organizationId,
      requestType: String(formData.get("requestType") ?? "access_request"),
      requestSubject: subject,
      requestBody: String(formData.get("requestBody") ?? "").trim() || null,
      priority: String(formData.get("priority") ?? "normal"),
      dueAt: String(formData.get("dueAt") ?? "").trim() || null,
      // A request submitted from the client portal must be readable by the
      // client; the default `internal` would hide it from their own list.
      visibility: "client_visible",
      sourceModule: "portal",
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to submit request",
    };
  }

  // Redirect outside the try/catch so NEXT_REDIRECT is never converted into an
  // inline error (USE-P2-007 / USE-P3-008).
  revalidatePath("/portal/approvals");
  redirect(`/portal/approvals/${created.id}`);
}

type ApprovalActionResult = { ok: boolean; error?: string };

export async function decideApprovalAction(
  id: string,
  decision: "approve" | "reject",
  notes: string,
): Promise<ApprovalActionResult> {
  const organizationId = await orgId();
  if (!organizationId) return { ok: false, error: "No approved organization membership." };

  try {
    const api = getApiClient();
    if (decision === "approve") {
      await api.approvals.approve(id, { organizationId, notes: notes.trim() || null });
    } else {
      if (!notes.trim()) return { ok: false, error: "A rejection reason is required." };
      await api.approvals.reject(id, { organizationId, reason: notes.trim() });
    }
    revalidatePath(`/portal/approvals/${id}`);
    revalidatePath("/portal/approvals");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Decision failed" };
  }
}

export async function commentApprovalAction(
  id: string,
  body: string,
): Promise<ApprovalActionResult> {
  if (!body.trim()) return { ok: false, error: "Comment is required." };
  try {
    await getApiClient().approvals.addComment(id, { body: body.trim(), isInternal: false });
    revalidatePath(`/portal/approvals/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Comment failed" };
  }
}
