import { ApiClient } from "./client";

export interface PermissionInfo {
  id: string;
  module_key: string;
  action_key: string;
  group_key?: string | null;
  scope?: string | null;
  label?: string | null;
  description?: string | null;
}

export interface MembershipBrief {
  organization_id: string;
  role_id: string;
  status: string;
}

export interface MyPermissionsResponse {
  isSuperAdmin: boolean;
  permissions: PermissionInfo[];
  keys: string[];
  roles: string[];
  memberships: MembershipBrief[];
}

export class PermissionsApi {
  constructor(private client: ApiClient) {}

  getMyPermissions() {
    return this.client.get<MyPermissionsResponse>("/api/v1/me/permissions");
  }
}
