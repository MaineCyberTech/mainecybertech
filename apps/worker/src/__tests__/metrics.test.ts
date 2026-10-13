import { jest } from "@jest/globals";

jest.mock("../logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
jest.mock("../producer", () => ({
  getTaskQueueStats: jest.fn(async () => ({ waiting: 1, active: 2 })),
}));
jest.mock("../queue-health", () => ({
  getWorkerQueueHealth: jest.fn(() => ({ connected: true })),
  // ARCH-P2-004: the metrics scrape publishes the worker's backend.
  getWorkerQueueBackend: jest.fn(() => "bullmq"),
}));

import { getMetrics } from "../metrics";
import { getWorkerQueueHealth } from "../queue-health";
import { recordRedisFailure } from "../redis-failures";

const mockedQueueHealth = getWorkerQueueHealth as jest.MockedFunction<typeof getWorkerQueueHealth>;

describe("worker_queue_connected gauge (RES-P2-008)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exports 1 while the queue connection is healthy", async () => {
    mockedQueueHealth.mockReturnValue({ connected: true });

    const body = await getMetrics();

    expect(body).toMatch(/^worker_queue_connected 1$/m);
    expect(body).toMatch(/^worker_task_queue_depth\{queue="mct-tasks"\} 3$/m);
  });

  it("exports 0 when the queue connection is lost", async () => {
    mockedQueueHealth.mockReturnValue({ connected: false, error: "Redis connection closed" });

    const body = await getMetrics();

    expect(body).toMatch(/^worker_queue_connected 0$/m);
  });
});

describe("worker queue backend + redis degradation metrics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exports the configured queue backend for parity with the API [ARCH-P2-004]", async () => {
    const body = await getMetrics();

    expect(body).toMatch(/^worker_queue_backend_info\{backend="bullmq"\} 1$/m);
  });

  it("counts Redis fallbacks so the degradation is alertable [ARCH-P2-005]", async () => {
    recordRedisFailure("scan_lock", "claim");

    const body = await getMetrics();

    expect(body).toMatch(
      /^worker_redis_failures_total\{component="scan_lock",operation="claim"\} 1$/m,
    );
  });
});
