import { logger } from "../logger";
import { getSupabaseAdmin } from "../services/supabase";
import type { TaskResult } from "../task-registry";

/**
 * Storage listing page size. `list()` is paginated: it returns at most `limit`
 * entries per call and never tells you the total, so a single call silently
 * truncates. We loop with an offset until a short page is returned.
 */
const LIST_PAGE_SIZE = 100;

/**
 * Hard ceiling on entries inspected per bucket. This is a safety valve, not a
 * correctness bound: if a bucket legitimately exceeds it we stop and refuse to
 * delete anything from that bucket rather than acting on a partial view.
 */
const MAX_LISTED = 10_000;

/** Storage entry shape returned by `list()`. Folders have a null `id`. */
type StorageEntry = { name: string; id?: string | null };

/**
 * Recursively list every object path in a bucket, following pagination.
 *
 * `list(prefix)` returns a mix of files and folder entries (folders have a
 * null `id`) and only shows nested objects when the folder prefix is listed, so
 * a single flat call both truncates and hides nested objects. Any read error
 * aborts the whole listing: an unreadable listing must never degrade into
 * "these files are orphans".
 */
async function listAllFiles(
  storageBucket: {
    list: (
      path: string,
      opts: { limit: number; offset: number },
    ) => Promise<{ data: StorageEntry[] | null; error: { message: string } | null }>;
  },
  bucket: string,
  prefix = "",
  seen = { count: 0 },
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await storageBucket.list(prefix, {
      limit: LIST_PAGE_SIZE,
      offset,
    });
    if (error) {
      throw new Error(`list ${bucket}/${prefix} failed: ${error.message}`);
    }
    const page = data ?? [];

    for (const entry of page) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        paths.push(...(await listAllFiles(storageBucket, bucket, fullPath, seen)));
      } else {
        paths.push(fullPath);
      }
    }

    seen.count += page.length;
    if (seen.count >= MAX_LISTED) {
      throw new Error(
        `list ${bucket} exceeded ${MAX_LISTED} entries; refusing to clean up a partial view`,
      );
    }

    if (page.length < LIST_PAGE_SIZE) break;
    offset += LIST_PAGE_SIZE;
  }

  return paths;
}

export async function orphanCleanup(_payload: Record<string, unknown>): Promise<TaskResult> {
  try {
    // Storage list/remove need the service role: the anon key is subject to
    // RLS and silently fails, so orphans would accumulate.
    const supabase = getSupabaseAdmin();
    const buckets = ["documents", "avatars"];

    let totalRemoved = 0;
    const failures: string[] = [];

    for (const bucket of buckets) {
      let paths: string[];
      try {
        paths = await listAllFiles(supabase.storage.from(bucket), bucket);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error({ bucket, error: message }, "Failed to list storage bucket");
        failures.push(`${bucket}: ${message}`);
        continue;
      }

      if (paths.length === 0) continue;

      // Determine the set of files that are still referenced. This is the step
      // that decides what gets DELETED, so a failed read here must abort the
      // bucket pass: treating an error as "no references" would delete every
      // file in the bucket. (Previously the error was ignored and `data` was
      // null, so the reference set was empty and the whole listing was removed.)
      let referenced: Set<string>;
      try {
        if (bucket === "documents") {
          // A path is referenced if it appears in ANY of: the live document
          // row, any version row (FILE-P1-003), or a file-request upload row
          // (FILE-P1-002). Objects under a folder are listed recursively, so
          // the reconciliation set must cover the same full paths.
          const { data: docs, error: docsError } = await supabase
            .from("documents")
            .select("storage_path")
            .in("storage_path", paths);
          if (docsError) throw new Error(docsError.message);

          const { data: versions, error: versionsError } = await supabase
            .from("document_versions")
            .select("storage_path")
            .in("storage_path", paths);
          if (versionsError) throw new Error(versionsError.message);

          const { data: requestUploads, error: uploadsError } = await supabase
            .from("file_request_uploads")
            .select("storage_path")
            .in("storage_path", paths);
          if (uploadsError) throw new Error(uploadsError.message);

          referenced = new Set<string>([
            ...(docs ?? []).map((d) => d.storage_path),
            ...(versions ?? []).map((v) => v.storage_path),
            ...(requestUploads ?? []).map((u) => u.storage_path),
          ]);
        } else {
          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("avatar_url")
            .not("avatar_url", "is", null);
          if (profilesError) throw new Error(profilesError.message);

          referenced = new Set(
            (profiles ?? [])
              .map((p) => p.avatar_url?.split("/").pop())
              .filter((x): x is string => Boolean(x)),
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(
          { bucket, error: message },
          "Failed to read referenced objects; skipping bucket",
        );
        failures.push(`${bucket}: ${message}`);
        continue;
      }

      const orphaned = paths.filter((p) => {
        const key = bucket === "documents" ? p : (p.split("/").pop() ?? p);
        return !referenced.has(key);
      });

      if (orphaned.length === 0) continue;

      const { error: removeError } = await supabase.storage.from(bucket).remove(orphaned);
      if (removeError) {
        logger.error(
          { bucket, count: orphaned.length, error: removeError.message },
          "Failed to remove orphaned files",
        );
        failures.push(`${bucket}: ${removeError.message}`);
      } else {
        logger.info({ bucket, count: orphaned.length }, "Removed orphaned storage files");
        totalRemoved += orphaned.length;
      }
    }

    logger.info({ totalRemoved, bucketFailures: failures.length }, "Orphan cleanup complete");

    // Report partial failure honestly rather than claiming success.
    if (failures.length > 0) {
      return { ok: false, error: failures.join("; ") };
    }
    return { ok: true };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error({ error: errMsg }, "Orphan cleanup task failed");
    return { ok: false, error: errMsg };
  }
}
