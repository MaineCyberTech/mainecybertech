import { ApiClient } from "./client";
export interface ModuleRecord {
  id: string;
  organization_id: string;
  name: string;
  status?: string;
  metadata?: Record<string, unknown>;
}
export class ModuleApi {
  constructor(private client: ApiClient) {}
  list(params: { organizationId: string }) {
    return this.client.get<ModuleRecord[]>("/api/v1/REPLACE", { params });
  }
}
