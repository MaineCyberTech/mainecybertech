import { MCTClient } from "@mct/sdk";

function getCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? match[1] : undefined;
}

export function getClientApi(): MCTClient {
  return MCTClient.create({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    getCsrfToken,
  });
}
