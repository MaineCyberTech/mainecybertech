import { jest } from "@jest/globals";

jest.mock("pino", () => {
  const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  return jest.fn(() => mockLogger);
});

jest.mock("dotenv/config", () => ({}));

jest.mock("../env", () => ({
  env: {
    // No REDIS_URL -> the lock is a pass-through.
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  },
  resolveRedisUrl: (url: string) => url,
}));

jest.mock("ioredis", () => jest.fn());

import { withScanLock } from "../lib/scan-lock";

describe("withScanLock", () => {
  it("runs the callback when Redis is not configured", async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    await withScanLock("some-scan", 1000, fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
