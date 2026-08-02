import { logger } from "../logger";
import type { TaskResult } from "../task-registry";

export async function orphanCleanup(
  _payload: Record<string, unknown>,
): Promise<TaskResult> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const { env } = await import("../env");

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    const buckets = ["documents", "avatars"];

    let totalRemoved = 0;

    for (const bucket of buckets) {
      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list("", { limit: 1000 });

      if (listError) {
        logger.error({ bucket, error: listError.message }, "Failed to list storage bucket");
        continue;
      }

      if (!files || files.length === 0) continue;

      const paths = files.map((f) => f.name);

      if (bucket === "documents") {
        const { data: docs } = await supabase
          .from("documents")
          .select("storage_path")
          .in("storage_path", paths);

        const referencedPaths = new Set((docs ?? []).map((d) => d.storage_path));
        const orphaned = paths.filter((p) => !referencedPaths.has(p));

        if (orphaned.length > 0) {
          const { error: removeError } = await supabase.storage
            .from(bucket)
            .remove(orphaned);

          if (removeError) {
            logger.error({ bucket, count: orphaned.length, error: removeError.message }, "Failed to remove orphaned files");
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

        const referencedUrls = new Set(
          (profiles ?? []).map((p) => p.avatar_url?.split("/").pop()),
        );
        const orphaned = paths.filter((p) => {
          const key = p.split("/").pop();
          return key && !referencedUrls.has(key);
        });

        if (orphaned.length > 0) {
          const { error: removeError } = await supabase.storage
            .from(bucket)
            .remove(orphaned);

          if (removeError) {
            logger.error({ bucket, count: orphaned.length, error: removeError.message }, "Failed to remove orphaned avatars");
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