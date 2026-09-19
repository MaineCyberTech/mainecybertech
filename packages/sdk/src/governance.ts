import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface GovernanceSop {
  id: string;
  organization_id: string;
  title: string;
  category: string;
  version: string;
  status: string;
  updated_at: string | null;
  created_at: string;
}
function qp(p?: Record<string, string | number | undefined>) {
  const r: Record<string, string | number | undefined> = {};
  if (p) for (const [k, v] of Object.entries(p)) if (v !== undefined) r[k] = v;
  return r;
}

export interface GovernanceChange {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  change_type: string;
  risk_level: string;
  rollback_plan: string | null;
  implementation_date: string | null;
  verification_steps: string | null;
  created_by: string | null;
  created_at: string;
}

export interface GovernanceRisk {
  id: string;
  organization_id: string;
  risk_description: string;
  risk_category: string;
  likelihood: string;
  impact: string;
  mitigating_controls: string | null;
  compensating_controls: string | null;
  acceptance_expires: string | null;
  created_by: string | null;
  created_at: string;
}

export interface GovernanceRetention {
  id: string;
  organization_id: string;
  data_category: string;
  system_name: string;
  retention_period_days: number;
  disposal_method: string | null;
  is_regulated: boolean;
  regulation_reference: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface GovernanceTabletop {
  id: string;
  organization_id: string;
  title: string;
  scenario: string;
  scenario_type: string;
  participants: string | null;
  scheduled_date: string | null;
  notes: string | null;
  action_items: string | null;
  after_action_report: string | null;
  created_by: string | null;
  created_at: string;
}

export class GovernanceApi {
  constructor(private c: ApiClient) {}
  changes = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<GovernanceChange>>("/api/v1/governance/change-requests", qp(p)),
    get: (id: string) => this.c.get<GovernanceChange>(`/api/v1/governance/change-requests/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/governance/change-requests", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/governance/change-requests/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/governance/change-requests/${id}`),
    submit: (id: string, d: Record<string, unknown> = {}) =>
      this.c.post(`/api/v1/governance/change-requests/${id}/submit`, d),
    approve: (id: string, d: Record<string, unknown> = {}) =>
      this.c.post(`/api/v1/governance/change-requests/${id}/approve`, d),
    reject: (id: string, d: Record<string, unknown> = {}) =>
      this.c.post(`/api/v1/governance/change-requests/${id}/reject`, d),
    implement: (id: string, d: Record<string, unknown> = {}) =>
      this.c.post(`/api/v1/governance/change-requests/${id}/implement`, d),
    verify: (id: string, d: Record<string, unknown> = {}) =>
      this.c.post(`/api/v1/governance/change-requests/${id}/verify`, d),
  };
  risks = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<GovernanceRisk>>("/api/v1/governance/risks", qp(p)),
    get: (id: string) => this.c.get<GovernanceRisk>(`/api/v1/governance/risks/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/governance/risks", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/governance/risks/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/governance/risks/${id}`),
    assess: (id: string, d: Record<string, unknown>) =>
      this.c.post(`/api/v1/governance/risks/${id}/assess`, d),
  };
  retention = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<GovernanceRetention>>("/api/v1/governance/retention", qp(p)),
    get: (id: string) => this.c.get<GovernanceRetention>(`/api/v1/governance/retention/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/governance/retention", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/governance/retention/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/governance/retention/${id}`),
  };
  tabletop = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<GovernanceTabletop>>("/api/v1/governance/tabletop", qp(p)),
    get: (id: string) => this.c.get<GovernanceTabletop>(`/api/v1/governance/tabletop/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/governance/tabletop", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/governance/tabletop/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/governance/tabletop/${id}`),
  };
  sopLibrary = {
    list: (params?: { page?: number; limit?: number; organizationId?: string }) =>
      this.c.get<PaginatedResult<GovernanceSop>>(
        "/api/v1/governance/sop-library",
        qp({
          page: params?.page,
          limit: params?.limit,
          organization_id: params?.organizationId,
        }),
      ),
    get: (id: string) => this.c.get(`/api/v1/governance/sop-library/${id}`),
    create: (data: Record<string, unknown>) => this.c.post("/api/v1/governance/sop-library", data),
    update: (id: string, data: Record<string, unknown>) =>
      this.c.patch(`/api/v1/governance/sop-library/${id}`, data),
    remove: (id: string) => this.c.delete(`/api/v1/governance/sop-library/${id}`),
    complianceMap: (params?: { organizationId: string }) =>
      this.c.get(
        "/api/v1/governance/sop-library/compliance-map",
        qp({ organization_id: params?.organizationId }),
      ),
  };
}
