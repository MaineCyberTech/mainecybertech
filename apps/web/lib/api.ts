import "server-only";
import { cookies } from "next/headers";
import { MCTClient } from "@mct/sdk";
import { getClientEnv } from "./env";

const SESSION_COOKIE = "mct_session";

export function getApiClient(): MCTClient {
  return MCTClient.create({
    baseUrl: getClientEnv().NEXT_PUBLIC_API_URL,
    getToken: async () => {
      const cookieStore = await cookies();
      return cookieStore.get(SESSION_COOKIE)?.value ?? null;
    },
  });
}
