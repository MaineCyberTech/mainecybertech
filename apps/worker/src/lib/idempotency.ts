import IORedis from "ioredis";
import { env, resolveRedisUrl } from "../env";
import { logger } from "../logger";

let client: IORedis | null = null;
let memoryMutex: Promise<void> | null = null;

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;
const IDEMPOTENCY_MAX_ENTRIES = 10_000;
const IN_MEMORY_FALLBACK = new Map<string, { value: string; expiresAt: number }>();

function getRedis(): IORedis | null {
  if (!env.REDIS_URL) return null;
  if (!client) {
    client = new IORedis(resolveRedisUrl(env.REDIS_URL, env.REDIS_PASSWORD), {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
      lazyConnect: true,
    });
    client.on("error", (error) => logger.warn({ error: error.message }, "idempotency redis error"));
    client.connect().catch((error: Error) =>
      logger.warn(
        { error: error.message },
        "Redis connection failed, idempotency will use in-memory fallback",
      ),
    );
  }
  return client;
}

function acquireMemoryLock(): Promise<void> {
  if (!memoryMutex) {
    memoryMutex = Promise.resolve();
  }
  const prev = memoryMutex;
  memoryMutex = new Promise<void>((resolve) => {
    prev.then(() => resolve());
  });
  return memoryMutex;
}

function evictInMemoryIfNeeded(): void {
  if (IN_MEMORY_FALLBACK.size >= IDEMPOTENCY_MAX_ENTRIES) {
    const oldest = IN_MEMORY_FALLBACK.keys().next();
    if (!oldest.done) {
      IN_MEMORY_FALLBACK.delete(oldest.value);
    }
  }
}

/**
 * Atomically claims an idempotency key (Redis SET NX EX, or in-memory mutex
 * fallback). Returns true only for the first caller — subsequent concurrent
 * callers receive false. Mirrors the API helper so the queued worker
 * dispatcher dedupes against the inline API dispatcher.
 */
export async function claimIdempotencyKey(
  key: string,
  value = "claimed",
  ttlSeconds: number = IDEMPOTENCY_TTL_SECONDS,
): Promise<boolean> {
  const redis = getRedis();
  const prefixedKey = `idempotency:${key}`;

  if (redis) {
    try {
      const result = await redis.set(prefixedKey, value, "EX", ttlSeconds, "NX");
      return result === "OK";
    } catch (error) {
      logger.warn(
        { error: error instanceof Error ? error.message : String(error) },
        "Redis claimIdempotencyKey failed, falling back to in-memory",
      );
    }
  }

  await acquireMemoryLock();
  try {
    const entry = IN_MEMORY_FALLBACK.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return false;
    }
    evictInMemoryIfNeeded();
    IN_MEMORY_FALLBACK.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return true;
  } finally {
    // lock is released by the promise chain
  }
}

export async function deleteIdempotencyKey(key: string): Promise<void> {
  const redis = getRedis();
  const prefixedKey = `idempotency:${key}`;

  if (redis) {
    try {
      await redis.del(prefixedKey);
      return;
    } catch (error) {
      logger.warn(
        { error: error instanceof Error ? error.message : String(error) },
        "Redis deleteIdempotencyKey failed",
      );
    }
  }

  await acquireMemoryLock();
  try {
    IN_MEMORY_FALLBACK.delete(key);
  } finally {
    // lock is released by the promise chain
  }
}

/** Tear down the idempotency client (tests / graceful shutdown). */
export async function closeIdempotency(): Promise<void> {
  if (client) {
    await client.quit().catch(() => undefined);
    client = null;
  }
}
