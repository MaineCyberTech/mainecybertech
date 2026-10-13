import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";
function qp(p?: Record<string, string | number | undefined>) {
  const r: Record<string, string | number | undefined> = {};
  if (p) for (const [k, v] of Object.entries(p)) if (v !== undefined) r[k] = v;
  return r;
}
export class EduAutomationApi {
  constructor(private c: ApiClient) {}
  /**
   * FEAT-P2-005: `sop_library` is canonically owned by the governance module.
   * This client is kept for backward compatibility but now calls the canonical
   * `/api/v1/governance/sop-library` surface (the old
   * `/api/v1/edu-automation/sop` path returns 410).
   */
  sop = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/governance/sop-library", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/governance/sop-library/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/governance/sop-library", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/governance/sop-library/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/governance/sop-library/${id}`),
  };
  compliance = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/compliance", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/compliance/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/compliance", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/compliance/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/compliance/${id}`),
    score: (d: Record<string, unknown>) =>
      this.c.post("/api/v1/edu-automation/compliance/score", d),
  };
  /**
   * FEAT-P2-005: `insurance_evidence` is canonically owned by the
   * insurance-binder module; this client is kept for backward compatibility
   * and now calls the canonical `/api/v1/insurance-binder` surface (the old
   * `/api/v1/edu-automation/insurance` path returns 410).
   */
  insurance = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/insurance-binder", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/insurance-binder/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/insurance-binder", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/insurance-binder/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/insurance-binder/${id}`),
  };
  aiPolicy = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/ai-policy", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/ai-policy/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/ai-policy", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/ai-policy/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/ai-policy/${id}`),
    generate: (id: string) => this.c.post(`/api/v1/edu-automation/ai-policy/${id}/generate`, {}),
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
    launch: (id: string) => this.c.post(`/api/v1/edu-automation/phishing/${id}/launch`),
    results: (id: string) => this.c.get(`/api/v1/edu-automation/phishing/${id}/results`),
    listTargets: (id: string, organizationId: string) =>
      this.c.get(`/api/v1/edu-automation/phishing/${id}/targets`, {
        organization_id: organizationId,
      }),
    createTarget: (
      id: string,
      organizationId: string,
      d: { email: string; name?: string | null },
    ) =>
      this.c.post(
        `/api/v1/edu-automation/phishing/${id}/targets?organization_id=${organizationId}`,
        d,
      ),
    removeTarget: (id: string, targetId: string, organizationId: string) =>
      this.c.delete(
        `/api/v1/edu-automation/phishing/${id}/targets/${targetId}?organization_id=${organizationId}`,
      ),
  };
  scorecards = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/scorecards", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/scorecards/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/scorecards", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/scorecards/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/scorecards/${id}`),
    summary: (p?: Record<string, string | number | undefined>) =>
      this.c.get("/api/v1/edu-automation/scorecards/summary", qp(p)),
    overview: (p?: Record<string, string | number | undefined>) =>
      this.c.get("/api/v1/edu-automation/scorecards/overview", qp(p)),
    leaderboard: () => this.c.get("/api/v1/edu-automation/scorecards/leaderboard"),
    evaluate: (d: Record<string, unknown>) =>
      this.c.post("/api/v1/edu-automation/scorecards/evaluate", d),
  };
  automation = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/automation", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/automation/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/automation", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/automation/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/automation/${id}`),
    execute: (id: string) => this.c.post(`/api/v1/edu-automation/automation/${id}/execute`),
    complete: (id: string, d: Record<string, unknown>) =>
      this.c.post(`/api/v1/edu-automation/automation/${id}/complete`, d),
  };
  powershell = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/powershell", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/powershell/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/powershell", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/powershell/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/powershell/${id}`),
    check: (id: string) => this.c.post(`/api/v1/edu-automation/powershell/${id}/check`),
    submit: (id: string, d: Record<string, unknown> = {}) =>
      this.c.post(`/api/v1/edu-automation/powershell/${id}/submit`, d),
    approve: (id: string, d: Record<string, unknown> = {}) =>
      this.c.post(`/api/v1/edu-automation/powershell/${id}/approve`, d),
    reject: (id: string, d: Record<string, unknown> = {}) =>
      this.c.post(`/api/v1/edu-automation/powershell/${id}/reject`, d),
  };
  kbGenerator = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/edu-automation/kb-generator", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/edu-automation/kb-generator/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/edu-automation/kb-generator", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/edu-automation/kb-generator/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/edu-automation/kb-generator/${id}`),
    generate: (id: string) => this.c.post(`/api/v1/edu-automation/kb-generator/${id}/generate`),
  };
}
