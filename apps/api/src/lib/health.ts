import { createClient } from "redis";
import { getEnv, type Env } from "../config/env";

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
    client = createClient({
      url: e.REDIS_URL,
      password: e.REDIS_PASSWORD ?? undefined,
      socket: { connectTimeout: 3_000, reconnectStrategy: () => 5_000 },
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
