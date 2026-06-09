import { MCTClient } from "@mct/sdk";

export function getClientApi(): MCTClient {
  return MCTClient.create({
    baseUrl: "",
  });
}
