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
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/sop", d),
  };
  compliance = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/compliance", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/compliance", d),
  };
  insurance = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/insurance", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/insurance", d),
  };
  aiPolicy = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/ai-policy", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/ai-policy", d),
  };
  kb = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/kb", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/kb", d),
  };
  training = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/training", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/training", d),
  };
  phishing = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/phishing", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/phishing", d),
  };
  scorecards = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/scorecards", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/scorecards", d),
  };
  automation = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/automation", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/automation", d),
  };
  powershell = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/powershell", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/powershell", d),
  };
  kbGenerator = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/kb-generator", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/kb-generator", d),
  };
}
