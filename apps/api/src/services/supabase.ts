import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "../config/env";

let _adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    const env = getEnv();
    _adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
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
    });
  }
  return _adminClient;
}
