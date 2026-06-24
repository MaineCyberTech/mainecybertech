import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "../config/env";
import WebSocket from "ws";
import {
  createSupabaseCircuitBreaker,
  CircuitBreaker,
} from "../lib/circuit-breaker";

let _adminClient: SupabaseClient | null = null;
const circuitBreaker = createSupabaseCircuitBreaker();

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
          fetch: (...args) => fetch(...args),
        },
        realtime: {
          transport: WebSocket as any,
        },
      },
    );
  }
  return _adminClient;
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
