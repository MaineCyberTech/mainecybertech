import http from "k6/http";
import { check, sleep, group } from "k6";

// k6 smoke test — validates API availability under minimal load
// Run: k6 run scripts/load-testing/api.basic.smoke.js

export const options = {
  vus: 2,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"], // <1% errors
    http_req_duration: ["p(95)<2000"], // 95% under 2s
  },
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
    });
    check(res, {
      "invalid login returns 401": (r) => r.status === 401,
    });
  });
}
