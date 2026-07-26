import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface OffboardingRecord {
  id: string;
  employee_name: string;
  offboarding_date: string | null;
  account_disabled: boolean;
  mailbox_converted: boolean;
  license_reclaimed: boolean;
  status: string;
}
export interface BreakGlassAccount {
  id: string;
  account_name: string;
  system: string;
  custodian_name: string | null;
  last_rotated_at: string | null;
  next_rotation_at: string | null;
  last_used_at: string | null;
  status: string;
}
export interface OnboardingClient {
  id: string;
  client_name: string;
  discovery_complete: boolean;
  m365_setup_complete: boolean;
  handoff_complete: boolean;
  status: string;
}
export interface PatchGroup {
  id: string;
  device_group: string;
  total_devices: number;
  patched_devices: number;
  pending_patches: number;
  critical_patches: number;
  compliance_pct: number | null;
}

export class SecurityOpsApi {
  constructor(private client: ApiClient) {}

  offboarding = {
    list: (params?: Record<string, string | number | undefined>) => {
      const qp: Record<string, string | number | undefined> = {};
      if (params) for (const [k, v] of Object.entries(params)) if (v !== undefined) qp[k] = v;
      return this.client.get<PaginatedResult<OffboardingRecord>>(
        "/api/v1/security-ops/offboarding",
        qp,
      );
    },
    get: (id: string) =>
      this.client.get<OffboardingRecord>(`/api/v1/security-ops/offboarding/${id}`),
    create: (d: Record<string, unknown>) =>
      this.client.post<OffboardingRecord>("/api/v1/security-ops/offboarding", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.client.patch<OffboardingRecord>(`/api/v1/security-ops/offboarding/${id}`, d),
  };

  breakGlass = {
    list: (params?: Record<string, string | number | undefined>) => {
      const qp: Record<string, string | number | undefined> = {};
      if (params) for (const [k, v] of Object.entries(params)) if (v !== undefined) qp[k] = v;
      return this.client.get<PaginatedResult<BreakGlassAccount>>(
        "/api/v1/security-ops/break-glass",
        qp,
      );
    },
    get: (id: string) =>
      this.client.get<BreakGlassAccount>(`/api/v1/security-ops/break-glass/${id}`),
    create: (d: Record<string, unknown>) =>
      this.client.post<BreakGlassAccount>("/api/v1/security-ops/break-glass", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.client.patch<BreakGlassAccount>(`/api/v1/security-ops/break-glass/${id}`, d),
  };

  onboarding = {
    list: (params?: Record<string, string | number | undefined>) => {
      const qp: Record<string, string | number | undefined> = {};
      if (params) for (const [k, v] of Object.entries(params)) if (v !== undefined) qp[k] = v;
      return this.client.get<PaginatedResult<OnboardingClient>>(
        "/api/v1/security-ops/onboarding",
        qp,
      );
    },
    get: (id: string) => this.client.get<OnboardingClient>(`/api/v1/security-ops/onboarding/${id}`),
    create: (d: Record<string, unknown>) =>
      this.client.post<OnboardingClient>("/api/v1/security-ops/onboarding", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.client.patch<OnboardingClient>(`/api/v1/security-ops/onboarding/${id}`, d),
  };

  patchCompliance = {
    list: (params?: Record<string, string | number | undefined>) => {
      const qp: Record<string, string | number | undefined> = {};
      if (params) for (const [k, v] of Object.entries(params)) if (v !== undefined) qp[k] = v;
      return this.client.get<PaginatedResult<PatchGroup>>(
        "/api/v1/security-ops/patch-compliance",
        qp,
      );
    },
    create: (d: Record<string, unknown>) =>
      this.client.post<PatchGroup>("/api/v1/security-ops/patch-compliance", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.client.patch<PatchGroup>(`/api/v1/security-ops/patch-compliance/${id}`, d),
    stats: (params?: Record<string, string | undefined>) => {
      const qp: Record<string, string | undefined> = {};
      if (params) for (const [k, v] of Object.entries(params)) if (v !== undefined) qp[k] = v;
      return this.client.get<{
        totalDevices: number;
        patchedDevices: number;
        criticalPatches: number;
        complianceRate: number;
      }>("/api/v1/security-ops/patch-compliance/stats", qp);
    },
  };
}
