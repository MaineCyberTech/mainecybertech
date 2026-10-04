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
  const inCalls: Record<string, string[][]> = {};
  const from = jest.fn((table: string) => {
    const chain = createThenableChain(opts.queryByTable?.[table] ?? { data: [], error: null });
    // Record the key chunks passed to `.in()` so tests can prove the reference
    // lookup is chunked (DATA-P2-002) rather than sent as one huge request.
    chain.in = jest.fn((_column: string, values: string[]) => {
      inCalls[table] = inCalls[table] ?? [];
      inCalls[table].push(values);
      return chain;
    });
    return chain;
  });

  const storageFrom = jest.fn((bucket: string) => ({
    list: jest.fn().mockImplementation((path: string, o: { limit: number; offset: number }) => {
      const err = opts.listErrorByBucket?.[bucket];
      if (err) return Promise.resolve({ data: null, error: err });

      let all: Entry[];
      if (opts.prefixEntries?.[bucket]?.[path] !== undefined) {
        // Pass nested listings through verbatim: folders must carry `id: null`
        // (or omit `id`) and files must carry a real `id`, exactly as the real
        // Storage API returns them. Tests that omit `id` on a file are now
        // caught instead of being silently treated as objects.
        all = opts.prefixEntries[bucket][path];
      } else if (path === "") {
        // Root flat listings are files; give them an id unless a test opts out.
        all = (opts.filesByBucket?.[bucket] ?? []).map((e) => ({
          ...e,
          id: e.id === undefined ? `file:${e.name}` : e.id,
        }));
      } else {
        all = [];
      }

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
  return { client, removeCalls, storageFrom, inCalls, from };
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
        documents: {
          data: [{ storage_path: "doc-1.pdf" }, { storage_path: "doc-2.pdf" }],
          error: null,
        },
      },
    });
    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
    expect(active.removeCalls.documents ?? []).toEqual([]);
  });

  it("removes only the genuinely orphaned files", async () => {
    const org = "00000000-0000-0000-0000-00000000000a";
    const keep = `orgs/${org}/doc-1.pdf`;
    const orphan = `orgs/${org}/orphan-1.pdf`;
    active = mockClient({
      prefixEntries: {
        documents: {
          "": [{ name: "orgs", id: null }],
          orgs: [{ name: org, id: null }],
          [`orgs/${org}`]: [
            { name: "doc-1.pdf", id: "f-keep" },
            { name: "orphan-1.pdf", id: "f-orphan" },
          ],
        },
      },
      queryByTable: { documents: { data: [{ storage_path: keep }], error: null } },
    });
    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
    expect(active.removeCalls.documents).toEqual([[orphan]]);
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
      queryByTable: {
        documents: { data: many.map((m) => ({ storage_path: m.name })), error: null },
      },
    });

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
    expect(active.removeCalls.documents ?? []).toEqual([]);
  });

  it("chunks the reference lookup for large buckets (DATA-P2-002)", async () => {
    // 450 objects => 3 postgrest `.in()` chunks per table at the 200-key bound,
    // instead of one request with 450 keys.
    const many = Array.from({ length: 450 }, (_, i) => ({ name: `f-${i}.pdf` }));
    active = mockClient({
      filesByBucket: { documents: many },
      queryByTable: {
        documents: { data: many.map((m) => ({ storage_path: m.name })), error: null },
      },
    });

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });

    const chunks = active.inCalls.documents ?? [];
    expect(chunks.length).toBe(3);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(200);
    }
    const totalKeys = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    expect(totalKeys).toBe(450);
    // The other reference tables are chunked the same way.
    expect((active.inCalls.document_versions ?? []).length).toBe(3);
    expect((active.inCalls.file_request_uploads ?? []).length).toBe(3);
  });

  it("handles an avatar orphan safely (nested, keyed by basename)", async () => {
    active = mockClient({
      prefixEntries: {
        avatars: {
          "": [
            { name: "user-1", id: null },
            { name: "user-2", id: null },
          ],
          "user-1": [{ name: "avatar.png", id: "a-keep" }],
          "user-2": [{ name: "old-avatar.png", id: "a-orphan" }],
        },
      },
      queryByTable: {
        profiles: {
          data: [
            {
              avatar_url:
                "https://x.supabase.co/storage/v1/object/public/avatars/user-1/avatar.png",
            },
          ],
          error: null,
        },
      },
    });

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
    expect(active.removeCalls.avatars).toEqual([["user-2/old-avatar.png"]]);
  });

  it("reports failure but still cleans the other bucket when one bucket fails", async () => {
    active = mockClient({
      prefixEntries: {
        avatars: {
          "": [{ name: "user-1", id: null }],
          "user-1": [{ name: "avatar.png", id: "a-orphan" }],
        },
      },
      filesByBucket: {
        documents: [{ name: "doc.pdf" }],
      },
      queryByTable: {
        documents: { data: null, error: { message: "db down" } },
        profiles: { data: [], error: null },
      },
    });

    const result = await orphanCleanup({});
    expect(active.removeCalls.documents ?? []).toEqual([]);
    expect(active.removeCalls.avatars).toEqual([["user-1/avatar.png"]]);
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
          [`orgs/${org}`]: [
            { name: "keep.pdf", id: "f-keep" },
            { name: "orphan.pdf", id: "f-orphan" },
          ],
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

  // --- DATA-P0-001 hardening: folders are never deletable ------------------

  it("treats a folder entry with an absent `id` as a folder, never an object [DATA-P0-001]", async () => {
    const org = "00000000-0000-0000-0000-00000000000b";
    const keep = `orgs/${org}/keep.pdf`;
    const orphan = `orgs/${org}/orphan.pdf`;
    active = mockClient({
      prefixEntries: {
        documents: {
          // No `id` at all: an older/proxied Storage response shape. This must
          // still be walked as a folder, never handed to remove().
          "": [{ name: "orgs" }],
          orgs: [{ name: org }],
          [`orgs/${org}`]: [
            { name: "keep.pdf", id: "f-keep" },
            { name: "orphan.pdf", id: "f-orphan" },
          ],
        },
      },
      queryByTable: {
        documents: { data: [{ storage_path: keep }], error: null },
      },
    });

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
    expect(active.removeCalls.documents).toEqual([[orphan]]);
    // The folder names themselves must never appear in a remove() call.
    expect((active.removeCalls.documents ?? []).flat()).not.toContain("orgs");
    expect((active.removeCalls.documents ?? []).flat()).not.toContain(org);
  });

  it("never removes the .emptyFolderPlaceholder marker [DATA-P0-001]", async () => {
    const org = "00000000-0000-0000-0000-00000000000c";
    const orphan = `orgs/${org}/orphan.pdf`;
    active = mockClient({
      prefixEntries: {
        documents: {
          "": [{ name: "orgs", id: null }],
          orgs: [{ name: org, id: null }],
          [`orgs/${org}`]: [
            { name: ".emptyFolderPlaceholder", id: "placeholder" },
            { name: "orphan.pdf", id: "f-orphan" },
          ],
        },
      },
      queryByTable: { documents: { data: [], error: null } },
    });

    const result = await orphanCleanup({});
    expect(result).toEqual({ ok: true });
    expect(active.removeCalls.documents).toEqual([[orphan]]);
  });

  it("aborts the bucket rather than removing a non-object (root) path [DATA-P0-001]", async () => {
    active = mockClient({
      // A bare root-level name has no "/" and cannot be proven to be an object
      // key; passing it to remove() is exactly the recursive-prefix hazard.
      filesByBucket: { documents: [{ name: "legacy-root.pdf" }] },
      queryByTable: { documents: { data: [], error: null } },
    });

    const result = await orphanCleanup({});
    expect(active.removeCalls.documents ?? []).toEqual([]);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("documents");
  });
});
