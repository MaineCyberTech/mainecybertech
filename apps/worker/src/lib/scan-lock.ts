import IORedis from "ioredis";
import { env, resolveRedisUrl } from "../env";
import { logger } from "../logger";

let client: IORedis | null = null;

function getClient(): IORedis | null {
  if (!env.REDIS_URL) return null;
  if (!client) {
    client = new IORedis(resolveRedisUrl(env.REDIS_URL, env.REDIS_PASSWORD), {
      maxRetriesPerRequest: null,
      lazyConnect: false,
    });
    client.on("error", (error) => logger.warn({ error: error.message }, "scan-lock redis error"));
  }
  return client;
}

/**
 * Run `fn` only if this process acquires the distributed lock for `name`.
 *
 * Scheduled scans run on every worker replica (each owns its own timers), so
 * without a lock scaling the worker would email/notify N times. The lock
 * expires after `ttlMs`; keep it shorter than the scan interval.
 */
export async function withScanLock(
  name: string,
  ttlMs: number,
  fn: () => Promise<void>,
): Promise<void> {
  const redis = getClient();
  if (!redis) {
    await fn();
    return;
  }

  const key = `mct:scan-lock:${name}`;
  const token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  let acquired: string | null = null;
  try {
    acquired = await redis.set(key, token, "PX", ttlMs, "NX");
  } catch (error) {
    // If Redis is unavailable, fall through and run (single-replica assumed).
    logger.warn(
      { error: error instanceof Error ? error.message : String(error), scan: name },
      "scan-lock unavailable - running without lock",
    );
    await fn();
    return;
  }

  if (acquired !== "OK") {
    logger.info({ scan: name }, "scan skipped - another replica holds the lock");
    return;
  }

  try {
    await fn();
  } finally {
    try {
      // Release only if we still own the lock (it may have expired).
      await redis.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) end",
        1,
        key,
        token,
      );
    } catch {
      // best-effort release
    }
  }
}

/** Tear down the lock client (tests / graceful shutdown). */
export async function closeScanLock(): Promise<void> {
  if (client) {
    await client.quit().catch(() => undefined);
    client = null;
  }
}
