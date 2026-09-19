import { createClient } from "redis";
import { getEnv, resolveRedisUrl, type Env } from "../config/env";

export interface DependencyCheck {
  status: "healthy" | "unhealthy" | "not_configured";
  latencyMs?: number;
  error?: string;
}

/**
 * Ping Redis with a short timeout. Returns "not_configured" when REDIS_URL is
 * unset so callers can treat Redis as optional.
 */
export async function checkRedisHealth(env?: Env): Promise<DependencyCheck> {
  const e = env ?? getEnv();
  if (!e.REDIS_URL) {
    return { status: "not_configured" };
  }

  const start = Date.now();
  let client;
  try {
    // resolveRedisUrl injects the password into the URL only when the URL
    // doesn't already carry credentials (mirrors middleware/cache.ts).
    // Passing url AND password separately makes node-redis reject the
    // connection when the URL already embeds credentials.
    client = createClient({
      url: resolveRedisUrl(e.REDIS_URL ?? "redis://redis:6379", e.REDIS_PASSWORD),
      socket: {
        connectTimeout: 3_000,
        // One-shot connect: NO reconnect strategy, so an unreachable Redis
        // fails the ping quickly instead of retrying forever and hanging the
        // /health endpoint (which would fail the deploy gate and take the
        // site down).
        reconnectStrategy: false,
      },
    });
    client.on("error", () => {}); // suppress default error logging during ping
    await client.connect();
    await client.ping();
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    if (client) {
      client.quit().catch(() => {});
    }
  }
}
