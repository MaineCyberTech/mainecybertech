import { jest } from "@jest/globals";
import { envSchema, parseEnv, type Env } from "../env";
import {
  registerTask,
  getTaskHandler,
  getRegisteredTaskTypes,
  executeTask,
  type TaskMessage,
  type TaskHandler,
  type TaskResult,
} from "../task-registry";

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
  const REQUIRED = {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  };

  it("parses valid env with defaults", () => {
    const env = parseEnv({ ...REQUIRED });

    expect(env.NODE_ENV).toBe("development");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.WORKER_CONCURRENCY).toBe(10);
    expect(env.WORKER_TIMEOUT).toBe(30000);
    expect(env.WORKER_TASK_TIMEOUT_MS).toBe(600000);
    expect(env.SUPABASE_URL).toBe("https://test.supabase.co");
    expect(env.SUPABASE_ANON_KEY).toBe("test-anon-key");
  });

  it("accepts provided values", () => {
    const env = parseEnv({
      ...REQUIRED,
      NODE_ENV: "production",
      LOG_LEVEL: "debug",
      WORKER_CONCURRENCY: "5",
      WORKER_TIMEOUT: "60000",
      WORKER_TASK_TIMEOUT_MS: "900000",
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_ANON_KEY: "test-key",
      SMTP_HOST: "smtp.test.local",
      QUEUE_BACKEND: "bullmq",
      REDIS_URL: "redis://localhost:6379",
    });

    expect(env.NODE_ENV).toBe("production");
    expect(env.LOG_LEVEL).toBe("debug");
    expect(env.WORKER_CONCURRENCY).toBe(5);
    expect(env.WORKER_TIMEOUT).toBe(60000);
    expect(env.WORKER_TASK_TIMEOUT_MS).toBe(900000);
    expect(env.SUPABASE_URL).toBe("https://test.supabase.co");
    expect(env.SUPABASE_ANON_KEY).toBe("test-key");
  });


  it("rejects QUEUE_BACKEND=inline in production [RES-P2-003]", () => {
    expect(() =>
      parseEnv({
        ...REQUIRED,
        NODE_ENV: "production",
        SMTP_HOST: "smtp.test.local",
      }),
    ).toThrow(/QUEUE_BACKEND/);
  });

  // ARCH-P2-004: the API only enqueues to BullMQ, so a production worker on
  // sqs would never consume its tasks — fail closed.
  it("rejects QUEUE_BACKEND=sqs in production [ARCH-P2-004]", () => {
    expect(() =>
      parseEnv({
        ...REQUIRED,
        NODE_ENV: "production",
        SMTP_HOST: "smtp.test.local",
        QUEUE_BACKEND: "sqs",
        SQS_QUEUE_URL: "https://sqs.us-east-1.amazonaws.com/123/q",
      }),
    ).toThrow(/QUEUE_BACKEND/);
  });

  it("accepts QUEUE_BACKEND=sqs outside production [ARCH-P2-004]", () => {
    const env = parseEnv({ ...REQUIRED, QUEUE_BACKEND: "sqs" });
    expect(env.QUEUE_BACKEND).toBe("sqs");
  });

  it("accepts QUEUE_BACKEND=bullmq in production [RES-P2-003]", () => {
    const env = parseEnv({
      ...REQUIRED,
      NODE_ENV: "production",
      SMTP_HOST: "smtp.test.local",
      QUEUE_BACKEND: "bullmq",
      REDIS_URL: "redis://localhost:6379",
    });
    expect(env.QUEUE_BACKEND).toBe("bullmq");
  });

  it("rejects invalid NODE_ENV", () => {
    expect(() => parseEnv({ ...REQUIRED, NODE_ENV: "invalid" })).toThrow();
  });

  it("rejects invalid LOG_LEVEL", () => {
    expect(() => parseEnv({ ...REQUIRED, LOG_LEVEL: "verbose" })).toThrow();
  });

  it("rejects non-numeric WORKER_CONCURRENCY", () => {
    expect(() => parseEnv({ ...REQUIRED, WORKER_CONCURRENCY: "abc" })).toThrow();
  });

  it("rejects invalid SUPABASE_URL", () => {
    expect(() => parseEnv({ ...REQUIRED, SUPABASE_URL: "not-a-url" })).toThrow();
  });

  it("coerces string numbers to numbers", () => {
    const env = parseEnv({
      ...REQUIRED,
      WORKER_CONCURRENCY: "42",
      WORKER_TIMEOUT: "99999",
    });

    expect(typeof env.WORKER_CONCURRENCY).toBe("number");
    expect(env.WORKER_CONCURRENCY).toBe(42);
    expect(env.WORKER_TIMEOUT).toBe(99999);
  });

  it("accepts SENTRY_TRACES_SAMPLE_RATE within 0-1 and coerces it", () => {
    for (const [raw, expected] of [
      ["0", 0],
      ["0.5", 0.5],
      ["1", 1],
    ] as const) {
      const env = parseEnv({ ...REQUIRED, SENTRY_TRACES_SAMPLE_RATE: raw });
      expect(env.SENTRY_TRACES_SAMPLE_RATE).toBe(expected);
    }
  });

  it("rejects SENTRY_TRACES_SAMPLE_RATE above 1 or below 0", () => {
    expect(() => parseEnv({ ...REQUIRED, SENTRY_TRACES_SAMPLE_RATE: "1.5" })).toThrow();
    expect(() => parseEnv({ ...REQUIRED, SENTRY_TRACES_SAMPLE_RATE: "-0.1" })).toThrow();
  });

  it("rejects non-numeric SENTRY_TRACES_SAMPLE_RATE", () => {
    expect(() => parseEnv({ ...REQUIRED, SENTRY_TRACES_SAMPLE_RATE: "abc" })).toThrow();
  });

  it("leaves SENTRY_TRACES_SAMPLE_RATE undefined when unset (service fallback applies)", () => {
    expect(parseEnv({ ...REQUIRED }).SENTRY_TRACES_SAMPLE_RATE).toBeUndefined();
  });

  it("accepts an optional SENTRY_RELEASE", () => {
    expect(parseEnv({ ...REQUIRED, SENTRY_RELEASE: "sha-123" }).SENTRY_RELEASE).toBe("sha-123");
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
    expect(handler).toHaveBeenCalledWith(
      { key: "value" },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("returns error for unknown task type", async () => {
    const result = await executeTask({
      type: "unknown-task-type",
      payload: {},
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Unknown task type");
  });

  it("rejects tenant scope on a task that does not declare it [MT-P2-006]", async () => {
    const handler = jest.fn<() => Promise<TaskResult>>().mockResolvedValue({ ok: true });
    registerTask("scope-test", handler);

    const result = await executeTask({
      type: "scope-test",
      payload: { organizationId: "00000000-0000-0000-0000-0000000000aa" },
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/does not accept tenant scope/i);
    expect(handler).not.toHaveBeenCalled();
  });

  it("validates declared tenant scope keys as UUIDs [MT-P2-006]", async () => {
    const handler = jest.fn<() => Promise<TaskResult>>().mockResolvedValue({ ok: true });
    registerTask("tenant-scope-test", handler, { tenantScopeKeys: ["organizationId"] });

    const invalid = await executeTask({
      type: "tenant-scope-test",
      payload: { organizationId: "not-a-uuid" },
    });
    expect(invalid.ok).toBe(false);
    expect(invalid.error).toMatch(/invalid organizationId/i);
    expect(handler).not.toHaveBeenCalled();

    const valid = await executeTask({
      type: "tenant-scope-test",
      payload: { organizationId: "00000000-0000-0000-0000-0000000000aa" },
    });
    expect(valid.ok).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("returns error when handler throws", async () => {
    const handler = jest
      .fn<() => Promise<TaskResult>>()
      .mockRejectedValue(new Error("handler exploded"));
    registerTask("throwing-task", handler);

    const result = await executeTask({
      type: "throwing-task",
      payload: {},
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("handler exploded");
  });

  it("aborts a handler that exceeds its deadline [RES-P2-002]", async () => {
    let receivedSignal: AbortSignal | undefined;
    const handler: TaskHandler = (_payload, context) =>
      new Promise<TaskResult>((resolve) => {
        receivedSignal = context?.signal;
        context?.signal.addEventListener("abort", () =>
          resolve({ ok: false, error: "aborted by signal" }),
        );
      });
    registerTask("slow-task", handler);

    const result = await executeTask({ type: "slow-task", payload: {} }, { timeoutMs: 20 });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("timed out");
    expect(receivedSignal?.aborted).toBe(true);
  });

  it("fails a handler that never settles even if it ignores the signal [RES-P2-002]", async () => {
    const handler: TaskHandler = () => new Promise<TaskResult>(() => {});
    registerTask("hung-task", handler);

    const result = await executeTask({ type: "hung-task", payload: {} }, { timeoutMs: 20 });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("timed out");
  });

  it("ping task returns ok", async () => {
    const result = await executeTask({
      type: "ping",
      payload: {},
    });

    expect(result.ok).toBe(true);
  });
});
