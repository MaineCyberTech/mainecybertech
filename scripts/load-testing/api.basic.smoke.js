import http from "k6/http";
import { check, sleep, group } from "k6";
import { BUDGETS, thresholdsFor } from "./budgets.js";
import { buildSummary } from "./summary.js";

// k6 smoke test — validates API availability under minimal load
// Run: k6 run scripts/load-testing/api.basic.smoke.js
// Budgets: scripts/load-testing/budgets.js, enforced by load-test.yml.

export const options = {
  vus: 2,
  duration: "30s",
  thresholds: thresholdsFor(BUDGETS.smoke),
};

const BASE_URL = __ENV.API_BASE_URL || "http://localhost:4000";

export default function () {
  group("Health endpoint", () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      "health returns 200": (r) => r.status === 200,
    });
  });

  sleep(1);

  group("Public init endpoint", () => {
    const res = http.get(`${BASE_URL}/api/v1/public/init`);
    check(res, {
      "public init returns 200": (r) => r.status === 200,
      "response has geo data": (r) => r.json("data") !== undefined,
    });
  });

  sleep(1);

  group("Auth sign-in (invalid credentials)", () => {
    const payload = JSON.stringify({
      email: "test@example.com",
      password: "wrong_password",
    });
    const res = http.post(`${BASE_URL}/api/v1/auth/sign-in`, payload, {
      headers: { "Content-Type": "application/json" },
      // 401 is the expected outcome for invalid credentials; 429 is the auth
      // rate limiter doing its job (the smoke loop repeats this call, and the
      // limiter is per-IP). Both are healthy outcomes for this probe and must
      // not count against the error-rate budget.
      responseCallback: http.expectedStatuses(401, 429),
    });
    check(res, {
      "invalid login is rejected (401 or 429)": (r) => r.status === 401 || r.status === 429,
    });
  });
}

export function handleSummary(data) {
  return buildSummary(data, "smoke");
}
