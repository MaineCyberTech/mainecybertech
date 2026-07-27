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
    get: (id: string) => this.c.get<unknown>(`/api/v1/final/sharepoint/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/sharepoint", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/final/sharepoint/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/final/sharepoint/${id}`),
  };
  deviceProfiles = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/device-profiles", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/final/device-profiles/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/device-profiles", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/final/device-profiles/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/final/device-profiles/${id}`),
  };
  saasAudit = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/saas-audit", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/final/saas-audit/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/saas-audit", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/final/saas-audit/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/final/saas-audit/${id}`),
  };
  procurement = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/procurement", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/final/procurement/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/procurement", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/final/procurement/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/final/procurement/${id}`),
  };
  dnsChanges = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/dns-changes", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/final/dns-changes/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/dns-changes", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/final/dns-changes/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/final/dns-changes/${id}`),
  };
  satisfaction = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/satisfaction", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/final/satisfaction/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/satisfaction", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/final/satisfaction/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/final/satisfaction/${id}`),
  };
  timeEntries = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/time-entries", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/final/time-entries/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/time-entries", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/final/time-entries/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/final/time-entries/${id}`),
  };
  budgets = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/budgets", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/final/budgets/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/budgets", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/final/budgets/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/final/budgets/${id}`),
  };
  runbooks = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/runbooks", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/final/runbooks/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/runbooks", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/final/runbooks/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/final/runbooks/${id}`),
  };
  forms = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/forms", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/final/forms/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/forms", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/final/forms/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/final/forms/${id}`),
  };
  backups = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/final/backups", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/final/backups/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/final/backups", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/final/backups/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/final/backups/${id}`),
    stats: (p?: Record<string, string | undefined>) =>
      this.c.get<{
        total: number;
        failed: number;
        untested: number;
        offsiteReplicated: number;
        encrypted: number;
      }>("/api/v1/final/backups/stats", qp(p)),
  };
}
