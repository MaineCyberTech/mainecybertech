import { ApiClient } from "./client";
import type { AuditLog, PaginatedResult } from "./types";

export class AuditApi {
  constructor(private client: ApiClient) {}

  list(params?: {
    page?: number;
    limit?: number;
    actorUserId?: string;
    organizationId?: string;
    action?: string;
    entityType?: string;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.actorUserId) qp.actor_user_id = params.actorUserId;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.action) qp.action = params.action;
    if (params?.entityType) qp.entity_type = params.entityType;
    return this.client.get<PaginatedResult<AuditLog>>("/api/v1/audit", qp);
  }

  exportData(params?: {
    format?: "csv" | "json";
    actorUserId?: string;
    organizationId?: string;
    action?: string;
    entityType?: string;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.format) qp.format = params.format;
    if (params?.actorUserId) qp.actor_user_id = params.actorUserId;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.action) qp.action = params.action;
    if (params?.entityType) qp.entity_type = params.entityType;
    return this.client.get<string>("/api/v1/audit/export", qp);
  }
}
