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
          retryStrategy: (times) => Math.min(times * 100, 3000),
          lazyConnect: true,
        });
        redisClient.on("error", (err) =>
          logger.error("Redis client error", { error: String(err) }),
        );
        redisClient.connect().catch((err) =>
          logger.warn(
            "Redis connection failed, idempotency will use in-memory fallback",
            {
              error: String(err),
            },
          ),
        );
      } catch (err) {
        logger.warn("Failed to initialize Redis client", {
          error: String(err),
        });
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
    } catch (err) {
      logger.warn(
        "Redis checkIdempotencyKey failed, falling back to in-memory",
        {
          error: String(err),
        },
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
    } catch (err) {
      logger.warn(
        "Redis storeIdempotencyKey failed, falling back to in-memory",
        {
          error: String(err),
        },
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
    } catch (err) {
      logger.warn("Redis deleteIdempotencyKey failed", { error: String(err) });
    }
  }

  IN_MEMORY_FALLBACK.delete(key);
}
