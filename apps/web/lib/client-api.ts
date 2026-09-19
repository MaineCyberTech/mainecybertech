import { MCTClient } from "@mct/sdk";
import { getClientEnv } from "./env";

function getCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? match[1] : undefined;
}

function getActiveOrgId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)mct_active_org=([^;]*)/);
  return match ? match[1] : null;
}

export function getClientApi(): MCTClient {
  return MCTClient.create({
    baseUrl: getClientEnv().NEXT_PUBLIC_API_URL,
    getCsrfToken,
    getActiveOrgId,
  });
}
