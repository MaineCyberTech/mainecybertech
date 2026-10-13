import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { summarizeBulkUpdate, type BulkItemFailure } from "@/lib/bulk-results";

export type DocumentVisibility = "private" | "org" | "public" | "internal";

export type BulkActionResult = {
  ok: boolean;
  kind?: "bulk_folder" | "bulk_metadata";
  error?: string;
  /** Ids the API reported as successfully updated (never the requested count). */
  ids?: string[];
  failed?: BulkItemFailure[];
  folderPath?: string | null;
  applied?: Record<string, unknown>;
};

const ALLOWED_VISIBILITY: DocumentVisibility[] = ["private", "org", "public", "internal"];

function trimOrNull(value: FormDataEntryValue | null) {
  const out = String(value ?? "").trim();
  return out ? out : null;
}

export async function bulkFolderAction(formData: FormData): Promise<BulkActionResult> {
  "use server";
  const api = getApiClient();
  try {
    const ids = formData.getAll("documentIds").map(String).filter(Boolean);
    const folderPath = trimOrNull(formData.get("folderPath"));
    if (!ids.length) return { ok: false, error: "Select at least one document." };
    if (!folderPath) return { ok: false, error: "Provide a folder path to apply." };

    const result = await api.documents.bulkFolder({ documentIds: ids, folderPath });
    const { succeeded, failed } = summarizeBulkUpdate(ids, result);
    revalidatePath("/admin/documents");
    if (!succeeded.length && failed.length) {
      return { ok: false, error: failed[0].error, ids: [], failed };
    }
    return { ok: true, kind: "bulk_folder", ids: succeeded, failed, folderPath };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }
}

export async function bulkMetadataAction(formData: FormData): Promise<BulkActionResult> {
  "use server";
  const api = getApiClient();
  try {
    const ids = formData.getAll("documentIds").map(String).filter(Boolean);
    const description = trimOrNull(formData.get("description"));
    const folderPath = trimOrNull(formData.get("folderPath"));
    const requestedVisibility = String(formData.get("visibility") ?? "").trim();
    const visibility = ALLOWED_VISIBILITY.includes(requestedVisibility as DocumentVisibility)
      ? requestedVisibility
      : null;

    if (!ids.length) return { ok: false, error: "Select at least one document." };

    if (!description && !folderPath && !visibility) {
      return {
        ok: false,
        error:
          "No non-empty bulk metadata fields were provided. Safe apply rules skipped blank values.",
      };
    }

    const result = await api.documents.bulkMetadata({
      documentIds: ids,
      description,
      folderPath,
      visibility,
      // ADMIN-P2-003: visibility changes are elevated on the API and require an
      // explicit confirmation. The operator chose a visibility value in the
      // modal and clicked apply, so echo that confirmation for the request.
      ...(visibility ? { confirm: true } : {}),
    });
    const { succeeded, failed } = summarizeBulkUpdate(ids, result);
    revalidatePath("/admin/documents");
    if (!succeeded.length && failed.length) {
      return { ok: false, error: failed[0].error, ids: [], failed };
    }
    return {
      ok: true,
      kind: "bulk_metadata",
      ids: succeeded,
      failed,
      applied: { description, folderPath, visibility },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }
}
