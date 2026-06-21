import { MCTClient } from "@mct/sdk";

export function getClientApi(): MCTClient {
  return MCTClient.create({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  });
}
