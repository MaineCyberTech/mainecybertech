import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";
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
  };
  risks = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<GovernanceRisk>>("/api/v1/governance/risks", qp(p)),
    get: (id: string) => this.c.get<GovernanceRisk>(`/api/v1/governance/risks/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/governance/risks", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/governance/risks/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/governance/risks/${id}`),
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
}
