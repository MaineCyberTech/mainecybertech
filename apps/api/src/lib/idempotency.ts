import Redis from "ioredis";
import { getEnv } from "../config/env.js";
import { logger } from "./logger.js";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!redisClient) {
    const env = getEnv();
    if (env.REDIS_URL) {
      try {
        redisClient = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => Math.min(times * 100, 3000),
          lazyConnect: true,
        });
        redisClient.on("error", (err: Error) =>
          logger.error({ error: String(err) }, "Redis client error"),
        );
        redisClient
          .connect()
          .catch((err: Error) =>
            logger.warn(
              { error: String(err) },
              "Redis connection failed, idempotency will use in-memory fallback",
            ),
          );
      } catch (err: unknown) {
        logger.warn(
          { error: String(err) },
          "Failed to initialize Redis client",
        );
      }
    }
  }
  return redisClient;
}

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;
const IN_MEMORY_FALLBACK = new Map<
  string,
  { value: string; expiresAt: number }
>();

export async function checkIdempotencyKey(key: string): Promise<string | null> {
  const redis = getRedisClient();
  const prefixedKey = `idempotency:${key}`;

  if (redis) {
    try {
      const value = await redis.get(prefixedKey);
      if (value) return value;
    } catch (err: unknown) {
      logger.warn(
        { error: String(err) },
        "Redis checkIdempotencyKey failed, falling back to in-memory",
      );
    }
  }

  const entry = IN_MEMORY_FALLBACK.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.value;
  }
  if (entry) {
    IN_MEMORY_FALLBACK.delete(key);
  }
  return null;
}

export async function storeIdempotencyKey(
  key: string,
  value: string,
): Promise<void> {
  const redis = getRedisClient();
  const prefixedKey = `idempotency:${key}`;

  if (redis) {
    try {
      await redis.setex(prefixedKey, IDEMPOTENCY_TTL_SECONDS, value);
      return;
    } catch (err: unknown) {
      logger.warn(
        { error: String(err) },
        "Redis storeIdempotencyKey failed, falling back to in-memory",
      );
    }
  }

  IN_MEMORY_FALLBACK.set(key, {
    value,
    expiresAt: Date.now() + IDEMPOTENCY_TTL_SECONDS * 1000,
  });
}

export async function deleteIdempotencyKey(key: string): Promise<void> {
  const redis = getRedisClient();
  const prefixedKey = `idempotency:${key}`;

  if (redis) {
    try {
      await redis.del(prefixedKey);
      return;
    } catch (err: unknown) {
      logger.warn({ error: String(err) }, "Redis deleteIdempotencyKey failed");
    }
  }

  IN_MEMORY_FALLBACK.delete(key);
}
