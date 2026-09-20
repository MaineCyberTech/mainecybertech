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

export interface ClientPortalEntitlement {
  module_key: string;
  enabled: boolean;
}

export class ClientPortalApi {
  constructor(private client: ApiClient) {}

  getBootstrap() {
    return this.client.get<ClientPortalBootstrap>("/api/v1/client-portal/bootstrap");
  }

  /** Admin: module entitlements provisioned for an organisation. */
  getEntitlements(organizationId: string) {
    return this.client.get<{ items: ClientPortalEntitlement[] }>(
      "/api/v1/client-portal/entitlements",
      { organization_id: organizationId },
    );
  }

  /** Admin: replace the provisioned module entitlements for an organisation. */
  setEntitlements(organizationId: string, modules: Array<{ moduleKey: string; enabled: boolean }>) {
    return this.client.put<{ updated: number }>("/api/v1/client-portal/entitlements", {
      organizationId,
      modules,
    });
  }
}
