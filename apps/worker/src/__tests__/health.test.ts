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
