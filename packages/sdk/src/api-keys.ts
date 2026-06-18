import { ApiClient } from "./client";

export type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type ApiKeyWithSecret = ApiKey & {
  fullKey: string;
};

export class ApiKeysApi {
  constructor(private client: ApiClient) {}

  async list(params?: { organizationId?: string }): Promise<ApiKey[]> {
    return this.client.get<ApiKey[]>(
      "/api/v1/api-keys",
      params as Record<string, string>,
    );
  }

  async create(data: {
    organizationId: string;
    name: string;
    expiresAt?: string;
  }): Promise<ApiKeyWithSecret> {
    return this.client.post<ApiKeyWithSecret>("/api/v1/api-keys", data);
  }

  async update(
    id: string,
    data: { isActive?: boolean; name?: string },
  ): Promise<ApiKey> {
    return this.client.patch<ApiKey>(`/api/v1/api-keys/${id}`, data);
  }

  async remove(id: string): Promise<void> {
    await this.client.delete(`/api/v1/api-keys/${id}`);
  }
}
