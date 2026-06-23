import http from "k6/http";
import { check, sleep, group } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<3000"],
  },
};

const BASE_URL = __ENV.API_BASE_URL || "http://localhost:4000";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

export default function () {
  group("Tickets list", () => {
    const res = http.get(`${BASE_URL}/api/v1/tickets?page=1&pageSize=20`, {
      headers,
    });
    check(res, {
      "tickets list returns 200": (r) => r.status === 200,
      "has pagination": (r) => r.json("pagination") !== undefined,
    });
  });

  sleep(1);

  group("Tickets create", () => {
    const payload = JSON.stringify({
      title: `Load test ticket ${Date.now()}`,
      description: "Created during load test",
      priority: "medium",
    });
    const res = http.post(`${BASE_URL}/api/v1/tickets`, payload, { headers });
    check(res, {
      "create returns 201": (r) => r.status === 201,
      "returns ticket id": (r) => r.json("data.id") !== undefined,
    });
  });

  sleep(2);

  group("Tickets get by id", () => {
    const listRes = http.get(`${BASE_URL}/api/v1/tickets?page=1&pageSize=1`, {
      headers,
    });
    const ticketId = listRes.json("data[0].id");
    if (ticketId) {
      const res = http.get(`${BASE_URL}/api/v1/tickets/${ticketId}`, {
        headers,
      });
      check(res, {
        "get ticket returns 200": (r) => r.status === 200,
      });
    }
  });

  sleep(1);
}
