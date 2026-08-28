import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Request } from "express";
import type { Database } from "@mct/sdk/database.types";
import { getEnv } from "../config/env";
import WebSocket from "ws";
import {
  createSupabaseCircuitBreaker,
  CircuitBreaker,
} from "../lib/circuit-breaker";

let _adminClient: SupabaseClient | null = null;
const circuitBreaker = createSupabaseCircuitBreaker();

function isTestEnv(): boolean {
  return (getEnv()?.NODE_ENV ?? process.env.NODE_ENV) === "test";
}

/**
 * Wrap the Supabase client's fetch with the circuit breaker so failing
 * Supabase calls (network errors / timeouts) trip the breaker instead of
 * cascading to every downstream request. In test environments the breaker is
 * bypassed to preserve existing test behavior.
 */
function circuitBreakingFetch(...args: Parameters<typeof fetch>): ReturnType<typeof fetch> {
  if (isTestEnv()) {
    return fetch(...args);
  }
  return circuitBreaker.execute(() => fetch(...args));
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    const env = getEnv();
    _adminClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        db: {
          timeout: 30_000,
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          fetch: circuitBreakingFetch,
        },
        realtime: {
          transport: WebSocket as any,
        },
      },
    );
  }
  return _adminClient;
}

/**
 * Unwrapped admin client for health probes and other non-request paths.
 * Circuit-breaker failures must NOT be counted from liveness/readiness probes â€”
 * a cold-starting dependency would otherwise trip the breaker and wedge the
 * whole API behind fail-fast "Circuit breaker is OPEN" errors.
 */
let _adminClientNoBreaker: SupabaseClient | null = null;

export function getSupabaseAdminNoBreaker(): SupabaseClient {
  if (!_adminClientNoBreaker) {
    const env = getEnv();
    _adminClientNoBreaker = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        db: { timeout: 30_000 },
        auth: { autoRefreshToken: false, persistSession: false },
        realtime: { transport: WebSocket as any },
      },
    );
  }
  return _adminClientNoBreaker;
}

/**
 * Per-request cache of user-scoped clients so a single request does not
 * spin up a fresh Supabase client on every `getSupabaseUser` call. Keyed by
 * the `req` object with a short TTL; entries are dropped once the request is
 * GC'd (WeakMap) or the TTL elapses, after which a fresh client is built.
 */
const USER_CLIENT_TTL_MS = 60_000;
const userClientCache = new WeakMap<Request, { client: SupabaseClient<Database>; expires: number }>();

function buildUserClient(jwt: string): SupabaseClient<Database> {
  const env = getEnv();
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    db: {
      timeout: 30_000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      // Route through the same circuit breaker as getSupabaseAdmin so failing
      // Supabase calls trip the breaker instead of cascading.
      fetch: circuitBreakingFetch,
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
    realtime: {
      transport: WebSocket as any,
    },
  });
}

/**
 * Build a user-scoped Supabase client authenticated with the request's JWT.
 *
 * @deprecated Prefer `getSupabaseUser(req, jwt)` (the request-aware overload)
 * which memoizes the client per request. The `getSupabaseUser(jwt)` overload is
 * retained for backwards compatibility and falls back to per-call creation.
 */
export function getSupabaseUser(jwt: string): SupabaseClient<Database>;
/**
 * Build (and cache) a user-scoped Supabase client for the given request.
 * Repeated calls within the same request and TTL reuse the cached client.
 */
export function getSupabaseUser(req: Request, jwt: string): SupabaseClient<Database>;
export function getSupabaseUser(reqOrJwt: Request | string, jwt?: string): SupabaseClient<Database> {
  if (typeof reqOrJwt === "string") {
    // Backwards-compatible per-call path: no request to key the cache on.
    return buildUserClient(reqOrJwt);
  }

  const req = reqOrJwt;
  const token = jwt!;
  const cached = userClientCache.get(req);
  if (cached && cached.expires > Date.now()) {
    return cached.client;
  }

  const client = buildUserClient(token);
  userClientCache.set(req, { client, expires: Date.now() + USER_CLIENT_TTL_MS });
  return client;
}

export function getSupabaseCircuitBreaker(): CircuitBreaker {
  return circuitBreaker;
}
