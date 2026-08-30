import { jest } from "@jest/globals";
import { webhookRetry } from "../tasks/webhook-retry";

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

jest.mock("../env", () => ({
  env: {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  },
}));

function createThenableChain(initialResult: unknown) {
  let result = initialResult;
  const chain: Record<string, jest.Mock> = {};
  const chainedMethods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "in",
    "lt",
    "lte",
    "order",
    "range",
    "limit",
  ];
  for (const m of chainedMethods) {
    chain[m] = jest.fn().mockReturnThis();
  }
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.then = (onFulfilled: (v: unknown) => unknown, onRejected: (e: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  chain._setResult = (r: unknown) => {
    result = r;
  };
  return chain;
}

let currentChain: ReturnType<typeof createThenableChain>;

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => currentChain),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        remove: jest.fn().mockResolvedValue({ error: null }),
        createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: "" }, error: null }),
      })),
    },
  })),
}));

describe("webhookRetry task", () => {
  beforeEach(() => {
    currentChain = createThenableChain({ data: [], error: null });
  });

  it("returns { ok: true } when no deliveries to retry", async () => {
    const result = await webhookRetry({});
    expect(result).toEqual({ ok: true });
  });

  it("returns { ok: false } when the database query fails", async () => {
    currentChain._setResult({ data: null, error: { message: "Database error" } });
    const result = await webhookRetry({});
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Database error");
  });
});
