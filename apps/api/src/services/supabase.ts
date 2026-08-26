import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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

export function getSupabaseUser(jwt: string): SupabaseClient {
  const env = getEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    db: {
      timeout: 30_000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (...args) => fetch(...args),
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
    realtime: {
      transport: WebSocket as any,
    },
  });
}

export function getSupabaseCircuitBreaker(): CircuitBreaker {
  return circuitBreaker;
}
