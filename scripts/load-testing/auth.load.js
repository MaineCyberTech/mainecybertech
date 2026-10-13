import http from "k6/http";
import { check, sleep, group } from "k6";
import { BUDGETS, thresholdsFor } from "./budgets.js";
import { buildSummary } from "./summary.js";

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: thresholdsFor(BUDGETS.auth),
};

const BASE_URL = __ENV.API_BASE_URL || "http://localhost:4000";
const TEST_EMAIL = __ENV.TEST_EMAIL || "loadtest@example.com";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "password123";

export default function () {
  group("Auth sign-in", () => {
    const payload = JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const res = http.post(`${BASE_URL}/api/v1/auth/sign-in`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    check(res, {
      "sign-in returns 200": (r) => r.status === 200,
      "returns access token": (r) => r.json("data.accessToken") !== undefined,
    });
  });

  sleep(1);

  group("Auth me (with token)", () => {
    const signInRes = http.post(
      `${BASE_URL}/api/v1/auth/sign-in`,
      JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
      { headers: { "Content-Type": "application/json" } },
    );

    const token = signInRes.json("data.accessToken");
    if (token) {
      const res = http.get(`${BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      check(res, {
        "me returns 200": (r) => r.status === 200,
        "returns user": (r) => r.json("data.user") !== undefined,
      });
    }
  });

  sleep(2);

  group("Auth callback (PKCE)", () => {
    const res = http.post(
      `${BASE_URL}/api/v1/auth/callback`,
      JSON.stringify({
        code: "test_code_" + Date.now(),
      }),
      {
        headers: { "Content-Type": "application/json" },
        // 400 is the expected outcome for an invalid code; mark it as an
        // expected response so it does not count against the error-rate budget.
        responseCallback: http.expectedStatuses(400),
      },
    );
    check(res, {
      "callback returns 400 for invalid code": (r) => r.status === 400,
    });
  });
}

export function handleSummary(data) {
  return buildSummary(data, "auth");
}
