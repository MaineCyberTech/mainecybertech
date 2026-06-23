import http from "k6/http";
import { check, sleep, group } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 100 },
    { duration: "30s", target: 500 },
    { duration: "10s", target: 1000 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.001"],
    http_req_duration: ["p(99)<100"],
  },
};

const BASE_URL = __ENV.API_BASE_URL || "http://localhost:4000";

export default function () {
  group("Health endpoint (high throughput)", () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      "health returns 200": (r) => r.status === 200,
      "response time < 50ms": (r) => r.timings.duration < 50,
    });
  });

  sleep(0.1);
}
