import { jest } from "@jest/globals";

/**
 * MT-P2-006: destructive/global maintenance tasks are scheduled by the worker
 * itself and must never be enqueued from an API request, so a future route
 * cannot turn request input into a platform-wide purge.
 */

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    REDIS_URL: "redis://localhost:6379",
    TASK_QUEUE_ENABLED: "true",
  }),
}));

jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockAdd = jest.fn().mockResolvedValue(undefined);
jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    add: mockAdd,
  })),
}));

import { enqueueTask } from "../lib/task-producer";

describe("task producer scheduled-only guard (MT-P2-006)", () => {
  it("refuses to enqueue destructive scheduled-only tasks", async () => {
    for (const type of [
      "retention",
      "public-interaction-retention",
      "orphan-cleanup",
      "api-key-prune",
    ]) {
      await expect(
        enqueueTask(type, { organizationId: "00000000-0000-0000-0000-0000000000aa" }),
      ).resolves.toBe(false);
    }

    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("still enqueues request-time tasks", async () => {
    await expect(enqueueTask("webhook-retry", {})).resolves.toBe(true);
    expect(mockAdd).toHaveBeenCalledWith("task", { type: "webhook-retry", payload: {} });
  });
});
