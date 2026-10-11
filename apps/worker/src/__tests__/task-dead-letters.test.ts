import { jest } from "@jest/globals";

jest.mock("../logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
jest.mock("../metrics", () => ({
  recordTaskDeadLetter: jest.fn(),
}));
jest.mock("../services/supabase", () => {
  const insert = jest.fn(async () => ({ error: null as unknown }));
  return {
    getSupabaseAdmin: jest.fn(() => ({ from: jest.fn(() => ({ insert })) })),
    __insert: insert,
  };
});

import { writeTaskDeadLetter } from "../task-dead-letters";
import { recordTaskDeadLetter } from "../metrics";

function insertMock(): jest.Mock {
  return (jest.requireMock("../services/supabase") as { __insert: jest.Mock }).__insert;
}

describe("writeTaskDeadLetter (RES-P2-002)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    insertMock().mockResolvedValue({ error: null });
  });

  it("persists the failed task and records the metric", async () => {
    await writeTaskDeadLetter({
      taskType: "retention",
      payload: { table: "audit_logs" },
      error: "delete failed",
      attempts: 3,
    });

    expect(recordTaskDeadLetter).toHaveBeenCalledWith("retention");
    expect(insertMock()).toHaveBeenCalledWith(
      expect.objectContaining({
        task_type: "retention",
        payload: { table: "audit_logs" },
        error: "delete failed",
        attempts: 3,
        last_attempt_at: expect.any(String),
      }),
    );
  });

  it("does not throw when the insert fails but still records the failure", async () => {
    insertMock().mockResolvedValue({ error: { message: "db down" } });

    await expect(
      writeTaskDeadLetter({
        taskType: "retention",
        payload: {},
        error: "delete failed",
        attempts: 3,
      }),
    ).resolves.toBeUndefined();

    expect(recordTaskDeadLetter).toHaveBeenCalledWith("retention");
  });
});
