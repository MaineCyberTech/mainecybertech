import { jest } from "@jest/globals";
import * as http from "http";
import { getWorkerQueueHealth } from "../queue-health";
import { startHealthServer } from "../health-server";

jest.mock("../logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// RES-P2-008: /health must report 503 when the queue connection is lost so the
// compose healthcheck and the deploy gate can act on it.
jest.mock("../queue-health", () => ({
  getWorkerQueueHealth: jest.fn(() => ({ connected: true })),
  // ARCH-P2-004: the consumer half of the queue backend contract.
  getWorkerQueueBackend: jest.fn(() => "bullmq"),
}));

// ARCH-P3-005: /metrics is token-gated; stub the renderer so the gate can be
// asserted without building real metrics.
jest.mock("../metrics", () => ({
  getMetrics: jest.fn(() => Promise.resolve("# HELP mct_worker\n")),
  getMetricsContentType: jest.fn(() => "text/plain; version=0.0.4"),
}));

const mockedQueueHealth = getWorkerQueueHealth as jest.MockedFunction<typeof getWorkerQueueHealth>;

function request(
  port: number,
  path: string,
): Promise<{ status: number; json: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () =>
        resolve({ status: res.statusCode ?? 0, json: JSON.parse(data) as Record<string, unknown> }),
      );
      res.on("error", reject);
    });
    req.on("error", reject);
  });
}

describe("worker health server", () => {
  let server: http.Server;

  beforeAll(
    () =>
      new Promise<void>((resolve) => {
        server = startHealthServer(0); // let OS assign a free port
        server.on("listening", () => resolve());
      }),
  );

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    mockedQueueHealth.mockReturnValue({ connected: true });
  });

  function port(): number {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("health server is not listening on a TCP port");
    }
    return address.port;
  }

  it("startHealthServer is a function", () => {
    expect(typeof startHealthServer).toBe("function");
  });

  it("returns 200 healthy while the queue is connected", async () => {
    const res = await request(port(), "/health");

    expect(res.status).toBe(200);
    expect(res.json).toMatchObject({ status: "healthy" });
    expect(typeof res.json.uptime).toBe("number");
    // ARCH-P2-004: the configured backend is part of the payload so operators
    // can compare it with the API's producer backend.
    expect(res.json.queueBackend).toBe("bullmq");
    expect(res.json.queue).toEqual({ connected: true });
  });

  it("returns 503 degraded when the queue connection is lost [RES-P2-008]", async () => {
    mockedQueueHealth.mockReturnValue({ connected: false, error: "Redis connection closed" });

    const res = await request(port(), "/health");

    expect(res.status).toBe(503);
    expect(res.json.status).toBe("degraded");
    expect(res.json.queue).toEqual({ connected: false, error: "Redis connection closed" });
  });
});

// ARCH-P3-005: worker /metrics must match the API's METRICS_TOKEN gate —
// fail closed without a configured token and 404 a wrong/missing bearer.
describe("worker /metrics auth", () => {
  function rawRequest(
    port: number,
    path: string,
    headers: Record<string, string> = {},
  ): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
      const req = http.get({ hostname: "127.0.0.1", port, path, headers }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
        res.on("error", reject);
      });
      req.on("error", reject);
    });
  }

  async function startServer(
    metricsToken?: string,
  ): Promise<{ server: http.Server; port: number }> {
    const server = startHealthServer(0, { metricsToken });
    await new Promise<void>((resolve) => server.on("listening", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("health server is not listening on a TCP port");
    }
    return { server, port: address.port };
  }

  it("404s without a configured token (fail closed)", async () => {
    const { server, port: p } = await startServer();
    try {
      const res = await rawRequest(p, "/metrics");
      expect(res.status).toBe(404);
      expect(res.body).toBe("");
    } finally {
      server.close();
    }
  });

  it("404s with a missing or wrong bearer token", async () => {
    const { server, port: p } = await startServer("metrics-secret");
    try {
      expect((await rawRequest(p, "/metrics")).status).toBe(404);
      expect(
        (await rawRequest(p, "/metrics", { authorization: "Bearer wrong-token" })).status,
      ).toBe(404);
    } finally {
      server.close();
    }
  });

  it("serves metrics with the correct bearer token", async () => {
    const { server, port: p } = await startServer("metrics-secret");
    try {
      const res = await rawRequest(p, "/metrics", { authorization: "Bearer metrics-secret" });
      expect(res.status).toBe(200);
      expect(res.body).toContain("mct_worker");
    } finally {
      server.close();
    }
  });

  it("rejects a URL query token (bearer header only)", async () => {
    const { server, port: p } = await startServer("metrics-secret");
    try {
      const res = await rawRequest(p, "/metrics?token=metrics-secret");
      expect(res.status).toBe(404);
    } finally {
      server.close();
    }
  });
});
