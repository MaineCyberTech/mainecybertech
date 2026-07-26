import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";
function qp(p?: Record<string, string | number | undefined>) {
  const r: Record<string, string | number | undefined> = {};
  if (p) for (const [k, v] of Object.entries(p)) if (v !== undefined) r[k] = v;
  return r;
}
export class FinalApi {
  constructor(private c: ApiClient) {}
  sharepoint = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/sharepoint", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/sharepoint", d),
  };
  deviceProfiles = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/device-profiles", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/device-profiles", d),
  };
  saasAudit = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/saas-audit", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/saas-audit", d),
  };
  procurement = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/procurement", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/procurement", d),
  };
  dnsChanges = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/dns-changes", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/dns-changes", d),
  };
  satisfaction = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/satisfaction", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/satisfaction", d),
  };
  timeEntries = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/time-entries", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/time-entries", d),
  };
  budgets = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/budgets", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/budgets", d),
  };
  runbooks = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/runbooks", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/runbooks", d),
  };
  forms = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/forms", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/forms", d),
  };
}
