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
let tableResults: Record<string, unknown>;

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      const initial = tableResults[table] ?? { data: [], error: null };
      return createThenableChain(initial);
    }),
    storage: {
      // Pass the bucket through so per-bucket adapters can be installed.
      from: jest.fn((bucket: string) => mockStorageFrom(bucket)),
    },
  })),
}));

type BucketAdapter = {
  list: jest.Mock;
  remove: jest.Mock;
  upload: jest.Mock;
  createSignedUrl: jest.Mock;
};

function adapterFor(
  files: Array<{ name: string; id?: string | null }>,
  remove?: jest.Mock,
): BucketAdapter {
  // list("") returns folder entries (id === null) and files. For flat test
  // paths every entry is a file, so pass id "1" by default.
  return {
    list: jest.fn().mockResolvedValue({
      data: files.map((f) => ({ name: f.name, id: f.id === undefined ? "1" : f.id })),
      error: null,
    }),
    remove: remove ?? jest.fn().mockResolvedValue({ error: null }),
    upload: jest.fn().mockResolvedValue({ error: null }),
    createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: "" }, error: null }),
  };
}

/** Only the `documents` bucket has content; `avatars` is always empty. */
function documentsBucket(files: Array<{ name: string; id?: string | null }>, remove?: jest.Mock) {
  return jest.fn((bucket: string) =>
    bucket === "documents" ? adapterFor(files, remove) : adapterFor([]),
  );
}

describe("orphanCleanup task", () => {
  beforeEach(() => {
    currentChain = createThenableChain({ data: [], error: null });
    tableResults = {};
    mockStorageFrom = documentsBucket([]);
  });

  it("returns { ok: true } when no files in storage", async () => {
    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
  });

  it("returns { ok: true } when all files are referenced (no orphans)", async () => {
    mockStorageFrom = documentsBucket([{ name: "doc-1.pdf" }, { name: "doc-2.pdf" }]);

    tableResults.documents = {
      data: [{ storage_path: "doc-1.pdf" }, { storage_path: "doc-2.pdf" }],
      error: null,
    };

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
  });

  it("returns { ok: true } when orphaned files are removed", async () => {
    mockStorageFrom = documentsBucket([{ name: "doc-1.pdf" }, { name: "orphan-1.pdf" }]);

    tableResults.documents = { data: [{ storage_path: "doc-1.pdf" }], error: null };

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

  it("spares a valid file-request upload referenced by file_request_uploads", async () => {
    const path = "00000000-0000-0000-0000-00000000000a/requests/tok/123-invoice.pdf";
    const remove = jest.fn().mockResolvedValue({ error: null });
    mockStorageFrom = documentsBucket([{ name: path }], remove);

    // A file-request intake object is not in documents/document_versions, only
    // in file_request_uploads. Cleanup must reconcile against that table.
    tableResults.documents = { data: [], error: null };
    tableResults.document_versions = { data: [], error: null };
    tableResults.file_request_uploads = { data: [{ storage_path: path }], error: null };

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
    expect(remove).not.toHaveBeenCalled();
  });

  it("spares a document version object referenced only by document_versions", async () => {
    const path = "00000000-0000-0000-0000-00000000000a/999-old.pdf";
    const remove = jest.fn().mockResolvedValue({ error: null });
    mockStorageFrom = documentsBucket([{ name: path }], remove);

    tableResults.documents = { data: [], error: null };
    tableResults.document_versions = { data: [{ storage_path: path }], error: null };
    tableResults.file_request_uploads = { data: [], error: null };

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
    expect(remove).not.toHaveBeenCalled();
  });
});
