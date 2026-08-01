import { jest } from "@jest/globals";
import { claimIdempotencyKey, deleteIdempotencyKey } from "../lib/idempotency";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
  }),
}));

jest.mock("../lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// No REDIS_URL in the mocked env → the in-memory fallback is exercised.
describe("claimIdempotencyKey (in-memory fallback)", () => {
  beforeEach(async () => {
    await deleteIdempotencyKey("test-key-1");
    await deleteIdempotencyKey("test-key-2");
  });

  it("claims a fresh key exactly once", async () => {
    const first = await claimIdempotencyKey("test-key-1", "processing");
    const second = await claimIdempotencyKey("test-key-1", "processing");

    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it("does not claim the same key concurrently (mutex serialization)", async () => {
    const results = await Promise.all([
      claimIdempotencyKey("test-key-2", "processing"),
      claimIdempotencyKey("test-key-2", "processing"),
      claimIdempotencyKey("test-key-2", "processing"),
    ]);

    const claimed = results.filter(Boolean).length;
    expect(claimed).toBe(1);
  });

  it("re-claims a key after deletion", async () => {
    expect(await claimIdempotencyKey("test-key-1")).toBe(true);
    await deleteIdempotencyKey("test-key-1");
    expect(await claimIdempotencyKey("test-key-1")).toBe(true);
  });
});
