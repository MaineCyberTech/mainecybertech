import { ApiClient } from "./client";
import type { Role } from "./types";

export interface RolePermissions {
  role: Role;
  permissions: Array<{ id: string; module_key: string; action_key: string; description?: string | null }>;
  rolePermissionIds: string[];
}

export class RolesApi {
  constructor(private client: ApiClient) {}

  list(params?: { ids?: string[] }) {
    const qp: Record<string, string> = {};
    if (params?.ids?.length) qp.ids = params.ids.join(",");
    return this.client.get<Role[]>("/api/v1/roles", qp);
  }

  get(id: string) {
    return this.client.get<Role>(`/api/v1/roles/${id}`);
  }

  getPermissions(roleId: string) {
    return this.client.get<RolePermissions>(`/api/v1/roles/${roleId}/permissions`);
  }

  updatePermission(roleId: string, permissionId: string, hasPermission: boolean) {
    return this.client.put<{ updated: boolean }>(`/api/v1/roles/${roleId}/permissions`, {
      permissionId,
      hasPermission,
    });
  }
}
