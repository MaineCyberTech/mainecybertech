import "server-only";
import { cookies } from "next/headers";
import { MCTClient } from "@mct/sdk";
import { getClientEnv } from "./env";

const SESSION_COOKIE = "mct_session";
const ACTIVE_ORG_COOKIE = "mct_active_org";

export function getApiClient(): MCTClient {
  return MCTClient.create({
    // ARCH-P3-003: server-side code reads API_INTERNAL_URL at runtime (the
    // compose web service sets it to http://api:4000). NEXT_PUBLIC_API_URL is
    // inlined into the bundle at build time, so it cannot be overridden at
    // runtime — it remains the fallback for local dev.
    baseUrl: process.env.API_INTERNAL_URL || getClientEnv().NEXT_PUBLIC_API_URL,
    getToken: async () => {
      const cookieStore = await cookies();
      return cookieStore.get(SESSION_COOKIE)?.value ?? null;
    },
    getActiveOrgId: async () => {
      const cookieStore = await cookies();
      return cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;
    },
  });
}
