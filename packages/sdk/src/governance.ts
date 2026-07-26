import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";
function qp(p?: Record<string, string | number | undefined>) {
  const r: Record<string, string | number | undefined> = {};
  if (p) for (const [k, v] of Object.entries(p)) if (v !== undefined) r[k] = v;
  return r;
}

export class GovernanceApi {
  constructor(private c: ApiClient) {}
  changes = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<Record<string, unknown>>>(
        "/api/v1/governance/change-requests",
        qp(p),
      ),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/governance/change-requests", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/governance/change-requests/${id}`, d),
  };
  risks = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<Record<string, unknown>>>("/api/v1/governance/risks", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/governance/risks", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/governance/risks/${id}`, d),
  };
  retention = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<Record<string, unknown>>>("/api/v1/governance/retention", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/governance/retention", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/governance/retention/${id}`, d),
  };
  tabletop = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<Record<string, unknown>>>("/api/v1/governance/tabletop", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/governance/tabletop", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/governance/tabletop/${id}`, d),
  };
}
