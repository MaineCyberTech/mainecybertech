import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import type { Database } from "@mct/sdk/database.types";
import { env } from "../env";
import ws from "ws";

export const wsTransport = ws as unknown as WebSocketLikeConstructor;

let client: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(env.SUPABASE_URL ?? "", env.SUPABASE_SERVICE_ROLE_KEY ?? "", {
      auth: { persistSession: false },
      realtime: { transport: wsTransport },
    });
  }
  return client;
}
