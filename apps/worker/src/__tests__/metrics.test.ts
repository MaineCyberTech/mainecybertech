import { jest } from "@jest/globals";

jest.mock("../logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
jest.mock("../producer", () => ({
  getTaskQueueStats: jest.fn(async () => ({ waiting: 1, active: 2 })),
}));
jest.mock("../queue-health", () => ({
  getWorkerQueueHealth: jest.fn(() => ({ connected: true })),
}));

import { getMetrics } from "../metrics";
import { getWorkerQueueHealth } from "../queue-health";

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
