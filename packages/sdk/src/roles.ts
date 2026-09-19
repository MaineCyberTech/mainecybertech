import { ApiClient } from "./client";
import type { Role } from "./types";

export interface RolePermissions {
  role: Role;
  permissions: Array<{
    id: string;
    module_key: string;
    action_key: string;
    description?: string | null;
  }>;
  rolePermissionIds: string[];
}

export type RoleWithPermissions = Role & { permissionCount: number };

export class RolesApi {
  constructor(private client: ApiClient) {}

  list(params?: { ids?: string[] }) {
    const qp: Record<string, string> = {};
    if (params?.ids?.length) qp.ids = params.ids.join(",");
    return this.client.get<Role[]>("/api/v1/roles", qp);
  }

  listWithPermissions() {
    return this.client.get<RoleWithPermissions[]>("/api/v1/roles/with-permissions");
  }

  get(id: string) {
    return this.client.get<Role>(`/api/v1/roles/${id}`);
  }

  create(data: { key: string; name: string; description?: string | null }) {
    return this.client.post<Role>("/api/v1/roles", data);
  }

  update(id: string, data: { name?: string; description?: string | null }) {
    return this.client.patch<Role>(`/api/v1/roles/${id}`, data);
  }

  delete(id: string) {
    return this.client.delete(`/api/v1/roles/${id}`);
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
