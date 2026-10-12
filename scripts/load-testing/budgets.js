// Committed performance budgets for the k6 load tests (audit TEST-P2-004).
//
// k6 evaluates `options.thresholds` at the end of every run and exits 99 when
// a threshold fails, so `.github/workflows/load-test.yml` fails a run whose
// p95 / p99 latency or error rate exceeds these numbers. Budgets are code:
// change them here in a reviewed PR — the workflow has no override input.
//
// The numbers target the deployed API over the public internet (a single
// shared droplet, not localhost), so they carry headroom over the in-stack
// API SLOs in docs/SLO.md (availability >= 99.9%, latency p95 < 500 ms).

export const BUDGETS = {
  // api.basic.smoke.js — availability under minimal load (scheduled).
  smoke: { errorRate: 0.01, p95Ms: 2000, p99Ms: 3000 },
  // tickets.load.js — CRUD load (dispatch-only).
  tickets: { errorRate: 0.05, p95Ms: 3000, p99Ms: 5000 },
  // auth.load.js — sign-in / me / callback (dispatch-only).
  auth: { errorRate: 0.02, p95Ms: 5000, p99Ms: 8000 },
  // sse.load.js — notification stream + polling fallback (dispatch-only).
  sse: { errorRate: 0.01, p95Ms: 1000, p99Ms: 2500 },
  // health.spike.js — /health spike (dispatch-only; not scheduled, an
  // unattended 1000-VU spike against the shared dev droplet is an outage).
  spike: { errorRate: 0.001, p95Ms: 250, p99Ms: 500 },
  // failure.injection.js — expected to FAIL (k6 exit 99) on the injected 5xx
  // burst; the error budget below is what must catch it (TEST-P2-004).
  failureInjection: { errorRate: 0.01, p95Ms: 2000, p99Ms: 3000 },
};

/** Build a k6 `thresholds` block from a budget entry. */
export function thresholdsFor(budget) {
  return {
    http_req_failed: [`rate<${budget.errorRate}`],
    http_req_duration: [`p(95)<${budget.p95Ms}`, `p(99)<${budget.p99Ms}`],
  };
}
