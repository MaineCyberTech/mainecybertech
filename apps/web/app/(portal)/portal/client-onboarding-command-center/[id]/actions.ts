"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export type ChecklistToggleResult = { ok: true } | { ok: false; error: string };

/**
 * USE-P2-008: complete/uncomplete an onboarding checklist item from the portal
 * detail page. The API and SDK already supported this (PATCH
 * /:id/checklist/:itemId) but nothing in the web app ever called it, so the
 * checkboxes rendered disabled and progress never advanced.
 */
export async function toggleChecklistItemAction(
  recordId: string,
  itemId: string,
  isCompleted: boolean,
): Promise<ChecklistToggleResult> {
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) {
    return { ok: false, error: "No approved organization membership found." };
  }

  try {
    const api = getApiClient();
    const user = await api.users.me();
    await api.clientOnboarding.updateChecklistItem(recordId, itemId, {
      isCompleted,
      completedBy: user?.userId ?? null,
    });
    revalidatePath(`/portal/client-onboarding-command-center/${recordId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update checklist item",
    };
  }
}
