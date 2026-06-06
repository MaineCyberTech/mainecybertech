import { ApiClient } from "./client";

export interface BulkInviteResult {
  ok: boolean;
  error?: string;
}

export class BulkApi {
  constructor(private client: ApiClient) {}

  invite(data: {
    organizationId: string;
    roleId: string;
    invites: Array<{ email: string; fullName?: string }>;
  }) {
    return this.client.post<{ results: BulkInviteResult[] }>("/api/v1/bulk/invite", data);
  }
}
