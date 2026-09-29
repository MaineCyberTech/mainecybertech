"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";

export type DeadLetterActionResult = {
  ok: boolean;
  error?: string;
};

function deadLetterId(formData: FormData): string {
  return String(formData.get("id") ?? "").trim();
}

export async function retryDeadLetterAction(formData: FormData): Promise<DeadLetterActionResult> {
  try {
    await requireAdminAccess();
    const id = deadLetterId(formData);
    if (!id) return { ok: false, error: "Missing dead-letter id." };

    await getApiClient().webhooks.retryDeadLetter(id);

    revalidatePath("/admin/webhooks/dead-letters");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }
}

export async function dismissDeadLetterAction(formData: FormData): Promise<DeadLetterActionResult> {
  try {
    await requireAdminAccess();
    const id = deadLetterId(formData);
    if (!id) return { ok: false, error: "Missing dead-letter id." };

    await getApiClient().webhooks.deleteDeadLetter(id);

    revalidatePath("/admin/webhooks/dead-letters");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }
}
