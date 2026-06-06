"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";

export type BulkActionResult = {
  ok: boolean;
  error?: string;
  updated?: number;
};

export async function bulkFolderAction(formData: FormData): Promise<BulkActionResult> {
  const api = getApiClient();
  const documentIds = JSON.parse(formData.get("documentIds") as string) as string[];
  const folderPath = formData.get("folderPath") as string;

  if (!documentIds.length || !folderPath) return { ok: false, error: "Missing required fields" };

  try {
    await api.documents.bulkFolder({ documentIds, folderPath });
    revalidatePath("/portal/documents");
    return { ok: true, updated: documentIds.length };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Bulk folder update failed" };
  }
}

export async function bulkMetadataAction(formData: FormData): Promise<BulkActionResult> {
  const api = getApiClient();
  const documentIds = JSON.parse(formData.get("documentIds") as string) as string[];
  const description = formData.get("description") as string | null;
  const folderPath = formData.get("folderPath") as string | null;

  if (!documentIds.length) return { ok: false, error: "No documents selected" };

  try {
    await api.documents.bulkMetadata({ documentIds, description: description || undefined, folderPath: folderPath || undefined });
    revalidatePath("/portal/documents");
    return { ok: true, updated: documentIds.length };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Bulk metadata update failed" };
  }
}
