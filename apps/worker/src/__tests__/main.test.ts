import { jest } from "@jest/globals";
import {
  envSchema,
  parseEnv,
  type Env,
  registerTask,
  getTaskHandler,
  getRegisteredTaskTypes,
  executeTask,
  type TaskMessage,
  type TaskResult,
} from "../main";

jest.mock("pino", () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return jest.fn(() => mockLogger);
});

jest.mock("dotenv/config", () => ({}));

describe("env schema", () => {
  it("parses valid env with defaults", () => {
    const env = parseEnv({});

    expect(env.NODE_ENV).toBe("development");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.WORKER_CONCURRENCY).toBe(10);
    expect(env.WORKER_TIMEOUT).toBe(30000);
    expect(env.SUPABASE_URL).toBeUndefined();
    expect(env.SUPABASE_ANON_KEY).toBeUndefined();
  });

  it("accepts provided values", () => {
    const env = parseEnv({
      NODE_ENV: "production",
      LOG_LEVEL: "debug",
      WORKER_CONCURRENCY: "5",
      WORKER_TIMEOUT: "60000",
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_ANON_KEY: "test-key",
    });

    expect(env.NODE_ENV).toBe("production");
    expect(env.LOG_LEVEL).toBe("debug");
    expect(env.WORKER_CONCURRENCY).toBe(5);
    expect(env.WORKER_TIMEOUT).toBe(60000);
    expect(env.SUPABASE_URL).toBe("https://test.supabase.co");
    expect(env.SUPABASE_ANON_KEY).toBe("test-key");
  });

  it("rejects invalid NODE_ENV", () => {
    expect(() => parseEnv({ NODE_ENV: "invalid" })).toThrow();
  });

  it("rejects invalid LOG_LEVEL", () => {
    expect(() => parseEnv({ LOG_LEVEL: "verbose" })).toThrow();
  });

  it("rejects non-numeric WORKER_CONCURRENCY", () => {
    expect(() => parseEnv({ WORKER_CONCURRENCY: "abc" })).toThrow();
  });

  it("rejects invalid SUPABASE_URL", () => {
    expect(() => parseEnv({ SUPABASE_URL: "not-a-url" })).toThrow();
  });

  it("coerces string numbers to numbers", () => {
    const env = parseEnv({
      WORKER_CONCURRENCY: "42",
      WORKER_TIMEOUT: "99999",
    });

    expect(typeof env.WORKER_CONCURRENCY).toBe("number");
    expect(env.WORKER_CONCURRENCY).toBe(42);
    expect(env.WORKER_TIMEOUT).toBe(99999);
  });
});

describe("task registry", () => {
  beforeEach(() => {
    const types = getRegisteredTaskTypes();
    for (const type of types) {
      getTaskHandler(type);
    }
  });

  it("registers a task handler", () => {
    const handler = jest.fn<() => Promise<TaskResult>>().mockResolvedValue({ ok: true });

    registerTask("test-task", handler);

    expect(getTaskHandler("test-task")).toBe(handler);
  });

  it("overwrites an existing task handler", () => {
    const handler1 = jest.fn<() => Promise<TaskResult>>().mockResolvedValue({ ok: true });
    const handler2 = jest.fn<() => Promise<TaskResult>>().mockResolvedValue({ ok: true });

    registerTask("overwrite-task", handler1);
    registerTask("overwrite-task", handler2);

    expect(getTaskHandler("overwrite-task")).toBe(handler2);
  });

  it("returns undefined for unregistered task type", () => {
    expect(getTaskHandler("nonexistent-task")).toBeUndefined();
  });

  it("lists registered task types including built-in ping", () => {
    const types = getRegisteredTaskTypes();
    expect(types).toContain("ping");
  });
});

describe("executeTask", () => {
  it("executes a registered task handler", async () => {
    const handler = jest.fn<() => Promise<TaskResult>>().mockResolvedValue({
      ok: true,
    });
    registerTask("exec-test", handler);

    const result = await executeTask({
      type: "exec-test",
      payload: { key: "value" },
    });

    expect(result.ok).toBe(true);
    expect(handler).toHaveBeenCalledWith({ key: "value" });
  });

  it("returns error for unknown task type", async () => {
    const result = await executeTask({
      type: "unknown-task-type",
      payload: {},
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Unknown task type");
  });

  it("returns error when handler throws", async () => {
    const handler = jest.fn<() => Promise<TaskResult>>().mockRejectedValue(
      new Error("handler exploded"),
    );
    registerTask("throwing-task", handler);

    const result = await executeTask({
      type: "throwing-task",
      payload: {},
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("handler exploded");
  });

  it("ping task returns ok", async () => {
    const result = await executeTask({
      type: "ping",
      payload: {},
    });

    expect(result.ok).toBe(true);
  });
});