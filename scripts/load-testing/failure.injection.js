import http from "k6/http";
import { check } from "k6";
import { BUDGETS, thresholdsFor } from "./budgets.js";
import { buildSummary } from "./summary.js";

// Failure-injection negative control (audit TEST-P2-004).
//
// Run this against scripts/load-testing/fault-injector.mjs in `inject` mode:
// the injector answers every request with 503 — a simulated edge/dependency
// 5xx burst. The run MUST breach the committed error-rate budget, i.e. k6
// must exit 99. load-test.yml asserts that exit code and this summary (all
// functional checks passed = the 503 burst was really observed). If the
// budgets ever stop failing a run on a 5xx burst, the workflow fails.
//
// Run: SUMMARY_PATH=failure-injection-summary.json \
//        k6 run scripts/load-testing/failure.injection.js
// (expect a non-zero exit; see .github/workflows/load-test.yml)

export const options = {
  vus: 3,
  duration: "15s",
  thresholds: thresholdsFor(BUDGETS.failureInjection),
};

const BASE_URL = __ENV.API_BASE_URL || "http://127.0.0.1:8080";

export default function () {
  const res = http.get(`${BASE_URL}/health`);
  check(res, {
    "injected 503 observed": (r) => r.status === 503,
  });
}

export function handleSummary(data) {
  return buildSummary(data, "failure-injection");
}
