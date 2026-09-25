import { jest } from "@jest/globals";
import { orphanCleanup } from "../tasks/orphan-cleanup";

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
    "not",
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
let mockStorageFrom: jest.Mock;

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => currentChain),
    storage: {
      from: jest.fn(() => mockStorageFrom()),
    },
  })),
}));

describe("orphanCleanup task", () => {
  beforeEach(() => {
    currentChain = createThenableChain({ data: [], error: null });
    mockStorageFrom = jest.fn(() => ({
      list: jest.fn().mockResolvedValue({ data: [], error: null }),
      remove: jest.fn().mockResolvedValue({ error: null }),
      upload: jest.fn().mockResolvedValue({ error: null }),
      createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: "" }, error: null }),
    }));
  });

  it("returns { ok: true } when no files in storage", async () => {
    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
  });

  it("returns { ok: true } when all files are referenced (no orphans)", async () => {
    mockStorageFrom = jest.fn(() => ({
      list: jest.fn().mockResolvedValue({
        data: [{ name: "doc-1.pdf" }, { name: "doc-2.pdf" }],
        error: null,
      }),
      remove: jest.fn().mockResolvedValue({ error: null }),
      upload: jest.fn().mockResolvedValue({ error: null }),
      createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: "" }, error: null }),
    }));

    currentChain._setResult({
      data: [{ storage_path: "doc-1.pdf" }, { storage_path: "doc-2.pdf" }],
      error: null,
    });

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
  });

  it("returns { ok: true } when orphaned files are removed", async () => {
    mockStorageFrom = jest.fn(() => ({
      list: jest.fn().mockResolvedValue({
        data: [{ name: "doc-1.pdf" }, { name: "orphan-1.pdf" }],
        error: null,
      }),
      remove: jest.fn().mockResolvedValue({ error: null }),
      upload: jest.fn().mockResolvedValue({ error: null }),
      createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: "" }, error: null }),
    }));

    currentChain._setResult({
      data: [{ storage_path: "doc-1.pdf" }],
      error: null,
    });

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
  });

  it("returns { ok: true } when storage list fails (skips bucket)", async () => {
    mockStorageFrom = jest.fn(() => ({
      list: jest.fn().mockResolvedValue({ data: null, error: { message: "List error" } }),
      remove: jest.fn().mockResolvedValue({ error: null }),
      upload: jest.fn().mockResolvedValue({ error: null }),
      createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: "" }, error: null }),
    }));

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
  });
});
