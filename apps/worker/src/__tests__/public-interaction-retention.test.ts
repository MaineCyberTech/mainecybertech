import { jest } from "@jest/globals";

/**
 * DATA-P2-006: the public-interaction PII purge must take its window from the
 * active `retention_policies` registry (an explicit payload window still wins)
 * and must refuse a non-positive window instead of setting the cutoff to
 * "now" and wiping the table.
 *
 * DATA-P3-003: the purge boundary is covered with an age-aware mock (rows
 * exactly at the cutoff survive; only strictly older rows are deleted).
 *
 * PRIV-P3-003: the purge deletes in bounded batches and reports the real
 * deleted count instead of one unbounded statement.
 */

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

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

type Row = { id: string; created_at: string };

type PolicyRow = {
  system_name?: string | null;
  data_category?: string | null;
  retention_period_days?: number | null;
};

interface ClientOpts {
  policies?: PolicyRow[];
  policiesError?: boolean;
  failOnDelete?: boolean;
}

/**
 * Age-aware Supabase mock: `limit()` honours the captured `.lt(col, cutoff)`
 * (strict less-than, like Postgres), and `delete().in(ids)` removes exactly
 * the selected rows. `select()` on `retention_policies` returns the registry.
 */
function makeClient(rows: Row[], opts: ClientOpts = {}) {
  const state = { rows: [...rows] };
  const ltCutoffs: string[] = [];
  const limitSizes: number[] = [];
  const deletedBatches: string[][] = [];
  let cutoff: string | null = null;

  function from(table: string) {
    const api = {
      select(_cols?: string) {
        return api;
      },
      delete() {
        return api;
      },
      eq() {
        return api;
      },
      lt(_col: string, c: string) {
        if (table !== "retention_policies") {
          cutoff = c;
          ltCutoffs.push(c);
        }
        return api;
      },
      limit(n: number) {
        limitSizes.push(n);
        const batch = state.rows
          .filter((r) => (cutoff ? r.created_at < cutoff : true))
          .slice(0, n);
        return Promise.resolve({ data: batch.map((r) => ({ id: r.id })), error: null });
      },
      in(_col: string, ids: string[]) {
        if (opts.failOnDelete) {
          return Promise.resolve({ data: null, error: { message: "permission denied" } });
        }
        deletedBatches.push([...ids]);
        state.rows = state.rows.filter((r) => !ids.includes(r.id));
        return Promise.resolve({ data: null, error: null });
      },
      then(resolve: (value: { data: unknown; error: unknown }) => unknown) {
        if (table === "retention_policies") {
          if (opts.policiesError) {
            return Promise.resolve({
              data: [],
              error: { message: "registry unavailable" },
            }).then(resolve);
          }
          return Promise.resolve({ data: opts.policies ?? [], error: null }).then(resolve);
        }
        return Promise.resolve({ data: [], error: null }).then(resolve);
      },
    };
    return api;
  }

  return {
    from,
    ltCutoffs,
    limitSizes,
    deletedBatches,
    remainingIds: () => state.rows.map((r) => r.id),
  };
}

import { getSupabaseAdmin } from "../services/supabase";
import { publicInteractionRetention } from "../tasks/public-interaction-retention";
import { BATCH_SIZE } from "../lib/purge";

const cutoffDays = (cutoff: string) =>
  (Date.now() - new Date(cutoff).getTime()) / (24 * 60 * 60 * 1000);

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

describe("publicInteractionRetention (DATA-P2-006)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("refuses a non-positive payload window before touching the database", async () => {
    for (const bad of [0, -5, Number.NaN]) {
      const res = await publicInteractionRetention({ retentionDays: bad });
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/positive number of days/);
    }
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("uses a matching retention_policies window (30 days) over the 90-day default", async () => {
    const client = makeClient([], {
      policies: [
        {
          system_name: "Contact Form",
          data_category: "Public Interactions",
          retention_period_days: 30,
        },
      ],
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(client);

    const res = await publicInteractionRetention({});

    expect(res.ok).toBe(true);
    expect(client.ltCutoffs).toHaveLength(1);
    expect(cutoffDays(client.ltCutoffs[0])).toBeGreaterThan(29);
    expect(cutoffDays(client.ltCutoffs[0])).toBeLessThan(31);
  });

  it("falls back to the 90-day default when no policy matches", async () => {
    const client = makeClient([], { policies: [] });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(client);

    const res = await publicInteractionRetention({});

    expect(res.ok).toBe(true);
    expect(cutoffDays(client.ltCutoffs[0])).toBeGreaterThan(89);
    expect(cutoffDays(client.ltCutoffs[0])).toBeLessThan(91);
  });

  it("falls back to the default when the registry read fails", async () => {
    const client = makeClient([], { policiesError: true });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(client);

    const res = await publicInteractionRetention({});

    expect(res.ok).toBe(true);
    expect(cutoffDays(client.ltCutoffs[0])).toBeGreaterThan(89);
    expect(cutoffDays(client.ltCutoffs[0])).toBeLessThan(91);
  });
});

describe("publicInteractionRetention purge boundary (DATA-P3-003)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes only rows strictly older than the cutoff (boundary survives)", async () => {
    const now = new Date("2026-10-12T12:00:00.000Z");
    jest.useFakeTimers({ now });
    try {
      const cutoffIso = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const client = makeClient(
        [
          {
            id: "expired",
            created_at: new Date(now.getTime() - 91 * 24 * 60 * 60 * 1000).toISOString(),
          },
          { id: "boundary", created_at: cutoffIso },
          {
            id: "fresh",
            created_at: new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        { policies: [] },
      );
      (getSupabaseAdmin as jest.Mock).mockReturnValue(client);

      const res = await publicInteractionRetention({});

      expect(res.ok).toBe(true);
      expect(res.deleted).toBe(1);
      expect(client.ltCutoffs).toEqual([cutoffIso]);
      expect(client.remainingIds()).toEqual(["boundary", "fresh"]);
    } finally {
      jest.useRealTimers();
    }
  });

  it("deletes in bounded batches and reports the deleted count (PRIV-P3-003)", async () => {
    const total = BATCH_SIZE * 2 + 5;
    const rows: Row[] = Array.from({ length: total }, (_, i) => ({
      id: `pi-${i}`,
      created_at: daysAgo(120),
    }));
    const client = makeClient(rows, { policies: [] });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(client);

    const res = await publicInteractionRetention({});

    expect(res.ok).toBe(true);
    expect(res.deleted).toBe(total);
    expect(res.batches).toBe(3);
    expect(res.truncated).toBe(false);
    // Every select/delete statement is bounded by BATCH_SIZE.
    expect(client.limitSizes).toEqual([BATCH_SIZE, BATCH_SIZE, BATCH_SIZE]);
    expect(client.deletedBatches.map((ids) => ids.length)).toEqual([
      BATCH_SIZE,
      BATCH_SIZE,
      5,
    ]);
    expect(client.remainingIds()).toEqual([]);
  });

  it("keeps fresh rows and reports no deletes when nothing is past the cutoff", async () => {
    const client = makeClient(
      [
        { id: "fresh-1", created_at: daysAgo(10) },
        { id: "fresh-2", created_at: daysAgo(89) },
      ],
      { policies: [] },
    );
    (getSupabaseAdmin as jest.Mock).mockReturnValue(client);

    const res = await publicInteractionRetention({});

    expect(res.ok).toBe(true);
    expect(res.deleted).toBe(0);
    expect(res.batches).toBe(0);
    expect(client.remainingIds()).toEqual(["fresh-1", "fresh-2"]);
  });

  it("returns ok:false and keeps the rows when the delete fails", async () => {
    const client = makeClient([{ id: "pi-1", created_at: daysAgo(120) }], {
      policies: [],
      failOnDelete: true,
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(client);

    const res = await publicInteractionRetention({});

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/permission denied/);
    expect(client.remainingIds()).toEqual(["pi-1"]);
  });
});
