import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";
function qp(p?: Record<string, string | number | undefined>) {
  const r: Record<string, string | number | undefined> = {};
  if (p) for (const [k, v] of Object.entries(p)) if (v !== undefined) r[k] = v;
  return r;
}
export class EduAutomationApi {
  constructor(private c: ApiClient) {}
  sop = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/sop", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/sop/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/sop", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/sop/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/sop/${id}`),
  };
  compliance = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/compliance", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/compliance/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/compliance", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/compliance/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/compliance/${id}`),
  };
  insurance = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/insurance", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/insurance/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/insurance", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/insurance/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/insurance/${id}`),
  };
  aiPolicy = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/ai-policy", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/ai-policy/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/ai-policy", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/ai-policy/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/ai-policy/${id}`),
  };
  kb = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/kb", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/kb/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/kb", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/kb/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/kb/${id}`),
  };
  training = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/training", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/training/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/training", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/training/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/training/${id}`),
  };
  phishing = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/phishing", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/phishing/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/phishing", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/phishing/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/phishing/${id}`),
  };
  scorecards = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/scorecards", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/scorecards/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/scorecards", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/scorecards/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/scorecards/${id}`),
  };
  automation = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/automation", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/automation/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/automation", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/automation/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/automation/${id}`),
  };
  powershell = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/powershell", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/powershell/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/powershell", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/powershell/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/powershell/${id}`),
  };
  kbGenerator = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/kb-generator", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/kb-generator/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/kb-generator", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/kb-generator/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/kb-generator/${id}`),
  };
}
