import { logger } from "../logger";
import { getSupabaseAdmin } from "../services/supabase";
import type { TaskResult } from "../task-registry";

export async function orphanCleanup(_payload: Record<string, unknown>): Promise<TaskResult> {
  try {
    // Storage list/remove need the service role: the anon key is subject to
    // RLS and silently fails, so orphans would accumulate.
    const supabase = getSupabaseAdmin();
    const buckets = ["documents", "avatars"];

    let totalRemoved = 0;

    for (const bucket of buckets) {
      const paths = await listObjectPaths(supabase, bucket);
      if (paths === null) {
        logger.error({ bucket }, "Failed to list storage bucket");
        continue;
      }

      if (paths.length === 0) continue;

      if (bucket === "documents") {
        // A path is referenced if it appears in ANY of: the live document row,
        // any version row (FILE-P1-003), or a file-request upload row
        // (FILE-P1-002). Objects under a folder are listed recursively, so the
        // reconciliation set must cover the same full paths.
        const { data: docs } = await supabase
          .from("documents")
          .select("storage_path")
          .in("storage_path", paths);

        const { data: versions } = await supabase
          .from("document_versions")
          .select("storage_path")
          .in("storage_path", paths);

        const { data: requestUploads } = await supabase
          .from("file_request_uploads")
          .select("storage_path")
          .in("storage_path", paths);

        const referencedPaths = new Set<string>([
          ...(docs ?? []).map((d) => d.storage_path),
          ...(versions ?? []).map((v) => v.storage_path),
          ...(requestUploads ?? []).map((u) => u.storage_path),
        ]);
        const orphaned = paths.filter((p) => !referencedPaths.has(p));

        if (orphaned.length > 0) {
          const { error: removeError } = await supabase.storage.from(bucket).remove(orphaned);

          if (removeError) {
            logger.error(
              { bucket, count: orphaned.length, error: removeError.message },
              "Failed to remove orphaned files",
            );
          } else {
            logger.info({ bucket, count: orphaned.length }, "Removed orphaned storage files");
            totalRemoved += orphaned.length;
          }
        }
      }

      if (bucket === "avatars") {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("avatar_url")
          .not("avatar_url", "is", null);

        const referencedUrls = new Set((profiles ?? []).map((p) => p.avatar_url?.split("/").pop()));
        const orphaned = paths.filter((p) => {
          const key = p.split("/").pop();
          return key && !referencedUrls.has(key);
        });

        if (orphaned.length > 0) {
          const { error: removeError } = await supabase.storage.from(bucket).remove(orphaned);

          if (removeError) {
            logger.error(
              { bucket, count: orphaned.length, error: removeError.message },
              "Failed to remove orphaned avatars",
            );
          } else {
            logger.info({ bucket, count: orphaned.length }, "Removed orphaned avatars");
            totalRemoved += orphaned.length;
          }
        }
      }
    }

    logger.info({ totalRemoved }, "Orphan cleanup complete");
    return { ok: true };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error({ error: errMsg }, "Orphan cleanup task failed");
    return { ok: false, error: errMsg };
  }
}

/**
 * Recursively collect full object paths in a bucket. `storage.list("")` returns
 * a mix of files and folder entries; nested objects (e.g. `<org>/requests/...`)
 * only appear when the folder prefix is listed. Returns `null` if listing fails.
 */
async function listObjectPaths(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  bucket: string,
  prefix = "",
): Promise<string[] | null> {
  const { data: entries, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });

  if (error) {
    logger.error({ bucket, prefix, error: error.message }, "Failed to list storage bucket");
    return null;
  }
  if (!entries || entries.length === 0) return [];

  const paths: string[] = [];
  for (const entry of entries) {
    const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    // Supabase represents folders as entries with a null id and no metadata.
    if (entry.id === null) {
      const nested = await listObjectPaths(supabase, bucket, fullPath);
      if (nested === null) return null;
      paths.push(...nested);
    } else {
      paths.push(fullPath);
    }
  }
  return paths;
}
