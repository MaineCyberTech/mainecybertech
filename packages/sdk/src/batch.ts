import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface LicenseRecord {
  id: string;
  vendor: string;
  product_name: string;
  total_seats: number;
  assigned_seats: number;
  unused_seats: number;
  annual_cost: number | null;
  reclaimable_savings: number | null;
  renewal_date: string | null;
  status: string;
}
export interface StatusItem {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  is_public: boolean;
  is_resolved: boolean;
  scheduled_start: string | null;
  scheduled_end: string | null;
}
export interface WebsiteMonitor {
  id: string;
  url: string;
  display_name: string | null;
  last_status: string;
  last_response_ms: number | null;
  ssl_valid: boolean;
  lighthouse_score: number | null;
}
export interface DmarcAssessment {
  id: string;
  domain: string;
  spf_valid: boolean;
  dkim_configured: boolean;
  dmarc_valid: boolean;
  dmarc_policy: string | null;
  status: string;
}

function qp(params?: Record<string, string | number | undefined>) {
  const result: Record<string, string | number | undefined> = {};
  if (params) for (const [k, v] of Object.entries(params)) if (v !== undefined) result[k] = v;
  return result;
}

export class BatchApi {
  constructor(private client: ApiClient) {}

  licenses = {
    list: (params?: Record<string, string | number | undefined>) =>
      this.client.get<PaginatedResult<LicenseRecord>>("/api/v1/batch/licenses", qp(params)),
    create: (d: Record<string, unknown>) =>
      this.client.post<LicenseRecord>("/api/v1/batch/licenses", d),
    savings: (params?: Record<string, string | undefined>) =>
      this.client.get<{
        totalLicenses: number;
        totalAnnualCost: number;
        reclaimableSavings: number;
        unusedSeats: number;
      }>("/api/v1/batch/licenses/savings", qp(params)),
  };

  status = {
    list: (params?: Record<string, string | number | undefined>) =>
      this.client.get<PaginatedResult<StatusItem>>("/api/v1/batch/status", qp(params)),
    create: (d: Record<string, unknown>) => this.client.post<StatusItem>("/api/v1/batch/status", d),
    public: () => this.client.get<StatusItem[]>("/api/v1/batch/status/public"),
  };

  websiteMonitors = {
    list: (params?: Record<string, string | number | undefined>) =>
      this.client.get<PaginatedResult<WebsiteMonitor>>(
        "/api/v1/batch/website-monitors",
        qp(params),
      ),
    create: (d: Record<string, unknown>) =>
      this.client.post<WebsiteMonitor>("/api/v1/batch/website-monitors", d),
  };

  dmarc = {
    list: (params?: Record<string, string | number | undefined>) =>
      this.client.get<PaginatedResult<DmarcAssessment>>("/api/v1/batch/dmarc", qp(params)),
    create: (d: Record<string, unknown>) =>
      this.client.post<DmarcAssessment>("/api/v1/batch/dmarc", d),
  };
}
