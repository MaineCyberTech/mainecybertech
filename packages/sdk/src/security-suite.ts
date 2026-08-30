import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface M365HardeningRecord {
  id: string;
  tenant_domain: string;
  mfa_enforced: boolean;
  conditional_access_configured: boolean;
  legacy_auth_blocked: boolean;
  overall_score: number | null;
  status: string;
}
export interface IncidentRecord {
  id: string;
  incident_type: string;
  title: string;
  severity: string;
  status: string;
  detected_at: string | null;
  contained_at: string | null;
}
export interface IdentityVerification {
  id: string;
  requestor_name: string;
  verification_method: string;
  verification_pass: boolean;
  status: string;
}
export interface EndpointSecurity {
  id: string;
  device_group: string;
  total_endpoints: number;
  av_installed: number;
  disk_encrypted: number;
  mdm_enrolled: number;
  coverage_pct: number | null;
}

function qp(params?: Record<string, string | number | undefined>) {
  const r: Record<string, string | number | undefined> = {};
  if (params) for (const [k, v] of Object.entries(params)) if (v !== undefined) r[k] = v;
  return r;
}

export class SecuritySuiteApi {
  constructor(private client: ApiClient) {}

  m365 = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.client.get<PaginatedResult<M365HardeningRecord>>(
        "/api/v1/security-suite/m365-hardening",
        qp(p),
      ),
    get: (id: string) =>
      this.client.get<M365HardeningRecord>(`/api/v1/security-suite/m365-hardening/${id}`),
    create: (d: Record<string, unknown>) =>
      this.client.post<M365HardeningRecord>("/api/v1/security-suite/m365-hardening", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.client.patch<M365HardeningRecord>(`/api/v1/security-suite/m365-hardening/${id}`, d),
    remove: (id: string) => this.client.delete(`/api/v1/security-suite/m365-hardening/${id}`),
  };

  incidents = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.client.get<PaginatedResult<IncidentRecord>>("/api/v1/security-suite/incidents", qp(p)),
    get: (id: string) => this.client.get<IncidentRecord>(`/api/v1/security-suite/incidents/${id}`),
    create: (d: Record<string, unknown>) =>
      this.client.post<IncidentRecord>("/api/v1/security-suite/incidents", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.client.patch<IncidentRecord>(`/api/v1/security-suite/incidents/${id}`, d),
    remove: (id: string) => this.client.delete(`/api/v1/security-suite/incidents/${id}`),
  };

  idVerify = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.client.get<PaginatedResult<IdentityVerification>>(
        "/api/v1/security-suite/identity-verification",
        qp(p),
      ),
    get: (id: string) =>
      this.client.get<IdentityVerification>(`/api/v1/security-suite/identity-verification/${id}`),
    create: (d: Record<string, unknown>) =>
      this.client.post<IdentityVerification>("/api/v1/security-suite/identity-verification", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.client.patch<IdentityVerification>(
        `/api/v1/security-suite/identity-verification/${id}`,
        d,
      ),
    remove: (id: string) =>
      this.client.delete(`/api/v1/security-suite/identity-verification/${id}`),
  };

  endpoints = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.client.get<PaginatedResult<EndpointSecurity>>(
        "/api/v1/security-suite/endpoint-security",
        qp(p),
      ),
    get: (id: string) =>
      this.client.get<EndpointSecurity>(`/api/v1/security-suite/endpoint-security/${id}`),
    create: (d: Record<string, unknown>) =>
      this.client.post<EndpointSecurity>("/api/v1/security-suite/endpoint-security", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.client.patch<EndpointSecurity>(`/api/v1/security-suite/endpoint-security/${id}`, d),
    remove: (id: string) => this.client.delete(`/api/v1/security-suite/endpoint-security/${id}`),
    coverage: (p?: Record<string, string | number | undefined>) =>
      this.client.get<Record<string, unknown>>(
        "/api/v1/security-suite/endpoint-security/coverage",
        qp(p),
      ),
  };
}
