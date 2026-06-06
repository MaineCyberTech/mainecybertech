import { ApiClient } from "./client";
import type { Membership } from "./types";

export class MembershipsApi {
  constructor(private client: ApiClient) {}

  list(params?: { organizationId?: string; status?: string; userId?: string }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    if (params?.userId) qp.user_id = params.userId;
    return this.client.get<Membership[]>("/api/v1/memberships", qp);
  }

  mine() {
    return this.client.get<Membership[]>("/api/v1/memberships/mine");
  }

  invite(data: { organizationId: string; email: string; roleId: string }) {
    return this.client.post<Membership>("/api/v1/memberships/invite", data);
  }

  update(
    id: string,
    data: {
      roleId: string;
      status: string;
      isBillingContact?: boolean;
      isSecurityContact?: boolean;
    },
  ) {
    return this.client.patch<Membership>(`/api/v1/memberships/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete<void>(`/api/v1/memberships/${id}`);
  }
}
