"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { formErrorMessage } from "@/lib/api-error";
import { getApprovedMembership } from "@/lib/auth/membership";

/**
 * USE-P3-003: restore a retained document version.
 *
 * The API copies the chosen version's bytes forward into a NEW version
 * (history is immutable), so a failed or unwanted restore is itself
 * reversible. The API enforces `documents:edit`, so a portal member without
 * that grant gets the API's permission error rather than a silent no-op.
 */
export async function restoreDocumentVersionAction(
  documentId: string,
  versionId: string,
): Promise<{ ok: boolean; error?: string; version?: number }> {
  try {
    const api = getApiClient();
    const membership = await getApprovedMembership();
    if (!membership?.organization_id) {
      return { ok: false, error: "No approved organization membership found." };
    }
    if (!documentId || !versionId) {
      return { ok: false, error: "A document and version are required." };
    }

    const document = await api.documents.restoreVersion(documentId, versionId);

    revalidatePath(`/portal/documents/${documentId}`);
    revalidatePath("/portal/documents");
    return { ok: true, version: document.current_version ?? undefined };
  } catch (error) {
    return { ok: false, error: formErrorMessage(error, "Restore failed. Please try again.") };
  }
}
