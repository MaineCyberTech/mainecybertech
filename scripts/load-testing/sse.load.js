import http from "k6/http";
import { check, sleep, group } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "2m", target: 200 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

const BASE_URL = __ENV.API_BASE_URL || "http://localhost:4000";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";

const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  Accept: "text/event-stream",
};

export default function () {
  group("SSE notifications stream", () => {
    const res = http.get(`${BASE_URL}/api/v1/notifications/stream`, {
      headers,
    });
    check(res, {
      "SSE returns 200": (r) => r.status === 200,
      "Content-Type is event-stream": (r) =>
        r.headers["Content-Type"]?.includes("text/event-stream"),
    });

    // Simulate keeping connection open for a few seconds
    sleep(5);
  });

  sleep(1);

  group("Notifications list (fallback polling)", () => {
    const res = http.get(
      `${BASE_URL}/api/v1/notifications?page=1&pageSize=20`,
      {
        headers: { ...headers, Accept: "application/json" },
      },
    );
    check(res, {
      "notifications list returns 200": (r) => r.status === 200,
      "has unread count": (r) => r.json("data.unreadCount") !== undefined,
    });
  });

  sleep(2);
}
