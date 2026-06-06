import { ApiClient } from "./client";
import type { DashboardSummary } from "./types";

export class DashboardApi {
  constructor(private client: ApiClient) {}

  summary() {
    return this.client.get<DashboardSummary>("/api/v1/dashboard/summary");
  }
}
