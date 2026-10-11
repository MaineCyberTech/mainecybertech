"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { summarizeBulkUpdate, type BulkItemFailure } from "@/lib/bulk-results";

export type BulkActionResult = {
  ok: boolean;
  error?: string;
  /** Ids the API reported as successfully updated (never the requested count). */
  updated?: number;
  successful?: number;
  failed?: BulkItemFailure[];
};

export async function bulkFolderAction(formData: FormData): Promise<BulkActionResult> {
  const api = getApiClient();
  const documentIds = JSON.parse(formData.get("documentIds") as string) as string[];
  const folderPath = formData.get("folderPath") as string;

  if (!documentIds.length || !folderPath) return { ok: false, error: "Missing required fields" };

  try {
    const result = await api.documents.bulkFolder({ documentIds, folderPath });
    const { succeeded, failed } = summarizeBulkUpdate(documentIds, result);
    revalidatePath("/portal/documents");
    if (!succeeded.length && failed.length) {
      return { ok: false, error: failed[0].error, failed };
    }
    return { ok: true, updated: succeeded.length, successful: succeeded.length, failed };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Bulk folder update failed" };
  }
}

export async function bulkMetadataAction(formData: FormData): Promise<BulkActionResult> {
  const api = getApiClient();
  const documentIds = JSON.parse(formData.get("documentIds") as string) as string[];
  const description = formData.get("description") as string | null;
  const folderPath = formData.get("folderPath") as string | null;

  if (!documentIds.length) return { ok: false, error: "No documents selected" };

  try {
    const result = await api.documents.bulkMetadata({
      documentIds,
      description: description || undefined,
      folderPath: folderPath || undefined,
    });
    const { succeeded, failed } = summarizeBulkUpdate(documentIds, result);
    revalidatePath("/portal/documents");
    if (!succeeded.length && failed.length) {
      return { ok: false, error: failed[0].error, failed };
    }
    return { ok: true, updated: succeeded.length, successful: succeeded.length, failed };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Bulk metadata update failed" };
  }
}
