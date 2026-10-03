import "server-only";
import { cookies } from "next/headers";
import { MCTClient } from "@mct/sdk";
import { getClientEnv } from "./env";

const SESSION_COOKIE = "mct_session";
const ACTIVE_ORG_COOKIE = "mct_active_org";

export function getApiClient(): MCTClient {
  return MCTClient.create({
    baseUrl: getClientEnv().NEXT_PUBLIC_API_URL,
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
