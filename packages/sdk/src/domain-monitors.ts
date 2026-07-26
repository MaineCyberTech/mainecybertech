import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface DomainMonitor {
  id: string;
  organization_id: string;
  domain: string;
  display_name: string | null;
  ssl_expires: string | null;
  ssl_valid: boolean;
  spf_status: string;
  dkim_status: string;
  dmarc_status: string;
  dmarc_policy: string | null;
  dns_provider: string;
  cloudflare_proxied: boolean;
  nameserver_mismatch: boolean;
  last_checked_at: string | null;
  check_interval_hours: number;
  alerts_enabled: boolean;
  status: string;
  created_at: string;
}

export interface DomainMonitorDetail extends DomainMonitor {
  recentChecks: unknown[];
}

export interface DomainStats {
  total: number;
  sslInvalid: number;
  sslExpiring: number;
  spfMissing: number;
  dkimMissing: number;
  dmarcMissing: number;
  nsMismatch: number;
  notProxied: number;
}

export class DomainMonitorsApi {
  constructor(private client: ApiClient) {}

  list(params?: {
    page?: number;
    limit?: number;
    organizationId?: string;
    status?: string;
    search?: string;
    sslExpiringBefore?: string;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page) qp.page = params.page;
    if (params?.limit) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    if (params?.search) qp.search = params.search;
    if (params?.sslExpiringBefore) qp.ssl_expiring_before = params.sslExpiringBefore;
    return this.client.get<PaginatedResult<DomainMonitor>>("/api/v1/domain-monitors", qp);
  }

  get(id: string) {
    return this.client.get<DomainMonitorDetail>(`/api/v1/domain-monitors/${id}`);
  }
  create(data: Record<string, unknown>) {
    return this.client.post<DomainMonitor>("/api/v1/domain-monitors", data);
  }
  update(id: string, data: Record<string, unknown>) {
    return this.client.patch<DomainMonitor>(`/api/v1/domain-monitors/${id}`, data);
  }
  remove(id: string) {
    return this.client.delete<void>(`/api/v1/domain-monitors/${id}`);
  }

  stats(params?: { organizationId?: string }) {
    const qp: Record<string, string | undefined> = {};
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.get<DomainStats>("/api/v1/domain-monitors/stats", qp);
  }

  exportData(params?: { format?: "csv" | "json"; organizationId?: string }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.format) qp.format = params.format;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.getBlob("/api/v1/domain-monitors/export", qp);
  }
}
