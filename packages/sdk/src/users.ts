import { ApiClient } from "./client";
import type { User, AuthUser, UserDetail } from "./types";

export interface PermissionOverride {
  id: string;
  organization_id: string;
  permission_id: string;
  is_allowed: boolean;
}

export interface UserPermissionsResponse {
  memberships: any[];
  permissions: Array<{ id: string; module_key: string; action_key: string; description?: string | null }>;
  rolePermissionIds: string[];
  overrides: PermissionOverride[];
}

export class UsersApi {
  constructor(private client: ApiClient) {}

  list() {
    return this.client.get<User[]>("/api/v1/users");
  }

  get(id: string) {
    return this.client.get<User>(`/api/v1/users/${id}`);
  }

  getDetail(id: string) {
    return this.client.get<UserDetail>(`/api/v1/users/${id}/detail`);
  }

  me() {
    return this.client.get<AuthUser>("/api/v1/auth/me");
  }

  updateRole(id: string, roleId: string) {
    return this.client.patch<{ updated: boolean }>(`/api/v1/users/${id}/role`, {
      roleId,
    });
  }

  getPermissions(userId: string) {
    return this.client.get<UserPermissionsResponse>(`/api/v1/users/${userId}/permissions`);
  }

  updatePermissions(userId: string, data: {
    permissionId: string;
    organizationId: string;
    isAllowed: boolean;
  }) {
    return this.client.put<{ updated: boolean }>(`/api/v1/users/${userId}/permissions`, data);
  }
}
