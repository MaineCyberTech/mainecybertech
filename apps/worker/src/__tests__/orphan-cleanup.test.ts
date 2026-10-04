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

/** Result for a `from(table).select(...)` reference query. */
type QueryResult = { data: unknown; error: { message: string } | null };

function createThenableChain(result: QueryResult) {
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
  return chain;
}

type Entry = { name: string; id?: string | null };

/**
 * Build a mock client where the reference query is answered PER TABLE. A single
 * shared result for `documents`/`document_versions`/`file_request_uploads` and
 * `profiles` could not catch the bug this suite guards: a failed reference read
 * was indistinguishable from "nothing is referenced".
 *
 * `filesByBucket` are flat listings served at the root prefix; `prefixEntries`
 * serves nested listings per prefix so folder recursion can be exercised.
 */
function mockClient(opts: {
  filesByBucket?: Record<string, Entry[]>;
  prefixEntries?: Record<string, Record<string, Entry[]>>;
  queryByTable?: Record<string, QueryResult>;
  listErrorByBucket?: Record<string, { message: string }>;
}) {
  const removeCalls: Record<string, string[][]> = {};
  const from = jest.fn((table: string) => {
    return createThenableChain(opts.queryByTable?.[table] ?? { data: [], error: null });
  });

  const storageFrom = jest.fn((bucket: string) => ({
    list: jest.fn().mockImplementation((path: string, o: { limit: number; offset: number }) => {
      const err = opts.listErrorByBucket?.[bucket];
      if (err) return Promise.resolve({ data: null, error: err });
      const all =
        opts.prefixEntries?.[bucket]?.[path] ??
        (path === "" ? (opts.filesByBucket?.[bucket] ?? []) : []);
      const page = all.slice(o.offset, o.offset + o.limit);
      return Promise.resolve({ data: page, error: null });
    }),
    remove: jest.fn().mockImplementation((paths: string[]) => {
      removeCalls[bucket] = removeCalls[bucket] ?? [];
      removeCalls[bucket].push(paths);
      return Promise.resolve({ error: null });
    }),
    upload: jest.fn().mockResolvedValue({ error: null }),
    createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: "" }, error: null }),
  }));

  const client = { from, storage: { from: storageFrom } };
  return { client, removeCalls, storageFrom };
}

let active: ReturnType<typeof mockClient>;

// `getSupabaseAdmin` caches the client in module scope, so the factory must
// return a STABLE object whose methods forward to whatever `active` is at call
// time - otherwise every test after the first reuses the first test's client.
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => active.client.from(table)),
    storage: { from: jest.fn((bucket: string) => active.client.storage.from(bucket)) },
  })),
}));

describe("orphanCleanup task", () => {
  it("returns { ok: true } when no files in storage", async () => {
    active = mockClient({ filesByBucket: { documents: [], avatars: [] } });
    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
  });

  it("returns { ok: true } and removes nothing when all files are referenced", async () => {
    active = mockClient({
      filesByBucket: { documents: [{ name: "doc-1.pdf" }, { name: "doc-2.pdf" }] },
      queryByTable: {
        documents: { data: [{ storage_path: "doc-1.pdf" }, { storage_path: "doc-2.pdf" }], error: null },
      },
    });
    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
    expect(active.removeCalls.documents ?? []).toEqual([]);
  });

  it("removes only the genuinely orphaned files", async () => {
    active = mockClient({
      filesByBucket: { documents: [{ name: "doc-1.pdf" }, { name: "orphan-1.pdf" }] },
      queryByTable: { documents: { data: [{ storage_path: "doc-1.pdf" }], error: null } },
    });
    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
    expect(active.removeCalls.documents).toEqual([["orphan-1.pdf"]]);
  });

  // --- the data-loss regression this suite exists to prevent ----------------

  it("DELETES NOTHING when the reference query errors (was: wiped the bucket)", async () => {
    active = mockClient({
      filesByBucket: {
        documents: [{ name: "a.pdf" }, { name: "b.pdf" }, { name: "c.pdf" }],
        avatars: [],
      },
      queryByTable: {
        documents: { data: null, error: { message: "connection reset" } },
      },
    });

    const result = await orphanCleanup({});

    // The bug: a null `data` from an errored query became an empty reference
    // set, so every listed file was treated as an orphan and removed.
    expect(active.removeCalls.documents ?? []).toEqual([]);
    // And the failure is reported honestly rather than as success.
    expect(result.ok).toBe(false);
    expect(result.error).toContain("documents");
  });

  it("DELETES NOTHING when the storage listing errors", async () => {
    active = mockClient({
      filesByBucket: { documents: [{ name: "a.pdf" }] },
      listErrorByBucket: { documents: { message: "list exploded" } },
    });

    const result = await orphanCleanup({});
    expect(active.removeCalls.documents ?? []).toEqual([]);
    expect(result.ok).toBe(false);
  });

  it("pages through a bucket larger than one listing page", async () => {
    // 250 files: more than the 100-item page size, so a single `list()` call
    // would have seen only the first 100.
    const many = Array.from({ length: 250 }, (_, i) => ({ name: `f-${i}.pdf` }));
    active = mockClient({
      filesByBucket: { documents: many },
      queryByTable: { documents: { data: many.map((m) => ({ storage_path: m.name })), error: null } },
    });

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
    expect(active.removeCalls.documents ?? []).toEqual([]);
  });

  it("handles an avatar orphan safely (keyed by basename)", async () => {
    active = mockClient({
      filesByBucket: { documents: [], avatars: [{ name: "user-1.png" }, { name: "stale.png" }] },
      queryByTable: {
        profiles: {
          data: [{ avatar_url: "https://x.supabase.co/storage/v1/object/public/avatars/user-1.png" }],
          error: null,
        },
      },
    });

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
    expect(active.removeCalls.avatars).toEqual([["stale.png"]]);
  });

  it("reports failure but still cleans the other bucket when one bucket fails", async () => {
    active = mockClient({
      filesByBucket: {
        documents: [{ name: "doc.pdf" }],
        avatars: [{ name: "stale.png" }],
      },
      queryByTable: {
        documents: { data: null, error: { message: "db down" } },
        profiles: { data: [], error: null },
      },
    });

    const result = await orphanCleanup({});
    expect(active.removeCalls.documents ?? []).toEqual([]);
    expect(active.removeCalls.avatars).toEqual([["stale.png"]]);
    expect(result.ok).toBe(false);
  });

  // --- reference coverage (documents + versions + file requests) ------------

  it("spares a valid file-request upload referenced by file_request_uploads", async () => {
    const path = "00000000-0000-0000-0000-00000000000a/requests/tok/123-invoice.pdf";
    active = mockClient({
      filesByBucket: { documents: [{ name: path }] },
      queryByTable: {
        documents: { data: [], error: null },
        document_versions: { data: [], error: null },
        file_request_uploads: { data: [{ storage_path: path }], error: null },
      },
    });

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
    expect(active.removeCalls.documents ?? []).toEqual([]);
  });

  it("spares a document version object referenced only by document_versions", async () => {
    const path = "00000000-0000-0000-0000-00000000000a/999-old.pdf";
    active = mockClient({
      filesByBucket: { documents: [{ name: path }] },
      queryByTable: {
        documents: { data: [], error: null },
        document_versions: { data: [{ storage_path: path }], error: null },
        file_request_uploads: { data: [], error: null },
      },
    });

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
    expect(active.removeCalls.documents ?? []).toEqual([]);
  });

  it("lists nested objects recursively and reconciles full paths", async () => {
    const org = "00000000-0000-0000-0000-00000000000a";
    const keep = `orgs/${org}/keep.pdf`;
    const orphan = `orgs/${org}/orphan.pdf`;
    active = mockClient({
      prefixEntries: {
        documents: {
          "": [{ name: "orgs", id: null }],
          orgs: [{ name: org, id: null }],
          [`orgs/${org}`]: [{ name: "keep.pdf" }, { name: "orphan.pdf" }],
        },
      },
      queryByTable: {
        documents: { data: [{ storage_path: keep }], error: null },
        document_versions: { data: [], error: null },
        file_request_uploads: { data: [], error: null },
      },
    });

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
    expect(active.removeCalls.documents).toEqual([[orphan]]);
  });

  it("refuses to remove a folder-like path (DATA-P0-001 guard)", async () => {
    // Simulate list-semantics drift: a folder entry that does NOT carry a null
    // id, so it looks like an object key at the bucket root. Supabase treats a
    // folder name as a recursive delete, so it must never reach storage.remove.
    active = mockClient({
      filesByBucket: { documents: [{ name: "orgs", id: "1" }] },
      queryByTable: { documents: { data: [], error: null } },
    });

    const result = await orphanCleanup({});

    expect(active.removeCalls.documents ?? []).toEqual([]);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("folder-like");
  });
});
