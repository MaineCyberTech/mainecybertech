import "server-only";
import { cookies } from "next/headers";
import { MCTClient } from "@mct/sdk";

const SESSION_COOKIE = "mct_session";

export function getApiClient(): MCTClient {
  return MCTClient.create({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    getToken: async () => {
      const cookieStore = await cookies();
      return cookieStore.get(SESSION_COOKIE)?.value ?? null;
    },
  });
}
