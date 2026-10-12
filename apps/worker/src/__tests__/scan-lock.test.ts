import { jest } from "@jest/globals";

jest.mock("pino", () => {
  const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  return jest.fn(() => mockLogger);
});

jest.mock("dotenv/config", () => ({}));

// Mutable env so a single suite can exercise the pass-through (no Redis) and
// the locked paths. The module under test is imported dynamically below so
// this Proxy is initialised before the mock factory reads it.
const envMock: Record<string, string | undefined> = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
};

jest.mock("../env", () => ({
  env: new Proxy(envMock, {
    get(target, prop: string) {
      return target[prop];
    },
    ownKeys() {
      return Reflect.ownKeys(envMock);
    },
    getOwnPropertyDescriptor() {
      return { configurable: true, enumerable: true };
    },
  }),
  resolveRedisUrl: (url: string) => url,
}));

const redisMock = {
  set: jest.fn(),
  eval: jest.fn(),
  quit: jest.fn(),
  on: jest.fn(),
};

jest.mock("ioredis", () => jest.fn(() => redisMock));

// ARCH-P2-005: the lock fallback must be metered, not just logged.
jest.mock("../redis-failures", () => ({
  recordRedisFailure: jest.fn(),
}));

import { recordRedisFailure } from "../redis-failures";

const mockedRecordRedisFailure = recordRedisFailure as jest.MockedFunction<
  typeof recordRedisFailure
>;

describe("withScanLock", () => {
  let withScanLock!: typeof import("../lib/scan-lock").withScanLock;
  let closeScanLock!: typeof import("../lib/scan-lock").closeScanLock;

  beforeAll(async () => {
    ({ withScanLock, closeScanLock } = await import("../lib/scan-lock"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    envMock.REDIS_URL = undefined;
    redisMock.set.mockResolvedValue("OK");
    redisMock.eval.mockResolvedValue(1);
    redisMock.quit.mockResolvedValue("OK");
  });

  afterAll(async () => {
    await closeScanLock();
  });

  it("runs the callback when Redis is not configured", async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    await withScanLock("some-scan", 1000, fn);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(redisMock.set).not.toHaveBeenCalled();
  });

  it("runs the callback and releases the lock when it is acquired", async () => {
    envMock.REDIS_URL = "redis://localhost:6379";
    const fn = jest.fn().mockResolvedValue(undefined);

    await withScanLock("some-scan", 1000, fn);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(redisMock.set).toHaveBeenCalledWith(
      "mct:scan-lock:some-scan",
      expect.any(String),
      "PX",
      1000,
      "NX",
    );
    expect(redisMock.eval).toHaveBeenCalledTimes(1);
  });

  it("skips the callback when another replica holds the lock", async () => {
    envMock.REDIS_URL = "redis://localhost:6379";
    redisMock.set.mockResolvedValue(null);
    const fn = jest.fn().mockResolvedValue(undefined);

    await withScanLock("some-scan", 1000, fn);

    expect(fn).not.toHaveBeenCalled();
    expect(redisMock.eval).not.toHaveBeenCalled();
  });

  it("runs the callback without a lock when Redis is unavailable", async () => {
    envMock.REDIS_URL = "redis://localhost:6379";
    redisMock.set.mockRejectedValue(new Error("connect ECONNREFUSED"));
    const fn = jest.fn().mockResolvedValue(undefined);

    await withScanLock("some-scan", 1000, fn);

    expect(fn).toHaveBeenCalledTimes(1);
    // ARCH-P2-005: the lost dedup is metered for alerting.
    expect(mockedRecordRedisFailure).toHaveBeenCalledWith("scan_lock", "claim");
  });

  it("releases the lock even when the callback throws", async () => {
    envMock.REDIS_URL = "redis://localhost:6379";
    const fn = jest.fn().mockRejectedValue(new Error("scan failed"));

    await expect(withScanLock("some-scan", 1000, fn)).rejects.toThrow("scan failed");

    expect(redisMock.eval).toHaveBeenCalledTimes(1);
  });
});
