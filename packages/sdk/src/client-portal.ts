import { ApiClient } from "./client";

export interface ClientPortalSubscription {
  status: string;
  planName: string | null;
  currentPeriodEnd: string | null;
}

export interface ClientPortalMembership {
  organizationId: string;
  organizationName: string | null;
  roleKey: string | null;
  roleName: string | null;
  status: string;
  subscription: ClientPortalSubscription | null;
  enabledModules: string[];
}

export interface ClientPortalBootstrap {
  profile: {
    fullName: string | null;
    email: string | null;
  };
  memberships: ClientPortalMembership[];
}

export class ClientPortalApi {
  constructor(private client: ApiClient) {}

  getBootstrap() {
    return this.client.get<ClientPortalBootstrap>("/api/v1/client-portal/bootstrap");
  }
}
