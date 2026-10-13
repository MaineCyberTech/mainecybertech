import { jest } from "@jest/globals";

/**
 * Tests for the bounded expired-API-key pruner (SEC-P2-017 / ACM-P2-005).
 *
 * Expired keys are rejected at authentication time, but the rows used to
 * accumulate forever. The task must deactivate expired keys, delete only keys
 * that expired beyond the grace period, and stay bounded (batched) while
 * reporting failures honestly.
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
  wsTransport: undefined,
  getSupabaseAdmin: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import { apiKeyPrune } from "../tasks/api-key-prune";

type Row = { id: string; is_active: boolean; expires_at: string | null };

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS).toISOString();
const daysAhead = (days: number) => new Date(Date.now() + days * DAY_MS).toISOString();

/**
 * Minimal fake of the PostgREST builder the task uses:
 *   select("id").eq("is_active", ...).lte("expires_at", ...).limit(n)  -> rows
 *   update(payload).in("id", ids)                                      -> mutate
 *   delete().in("id", ids)                                             -> remove
 */
function makeClient(rows: Row[], opts: { failUpdate?: boolean } = {}) {
  const deleteCalls: string[][] = [];
  const from = jest.fn((_table: string) => {
    const filters: { isActive?: boolean; expiresLte?: string } = {};
    let updatePayload: Record<string, unknown> | null = null;
    let isDelete = false;
    let limit = Number.MAX_SAFE_INTEGER;

    const builder = {
      select: (_cols: string) => builder,
      update: (payload: Record<string, unknown>) => {
        updatePayload = payload;
        return builder;
      },
      delete: () => {
        isDelete = true;
        return builder;
      },
      eq: (col: string, value: boolean) => {
        if (col === "is_active") filters.isActive = value;
        return builder;
      },
      lte: (col: string, value: string) => {
        if (col === "expires_at") filters.expiresLte = value;
        return builder;
      },
      limit: (n: number) => {
        limit = n;
        return builder;
      },
      in: (_col: string, ids: string[]) => {
        if (isDelete) {
          deleteCalls.push(ids);
          for (const id of ids) {
            const index = rows.findIndex((row) => row.id === id);
            if (index >= 0) rows.splice(index, 1);
          }
          return Promise.resolve({ error: null });
        }
        if (opts.failUpdate) {
          return Promise.resolve({ error: { message: "permission denied" } });
        }
        for (const row of rows) {
          if (ids.includes(row.id) && updatePayload) Object.assign(row, updatePayload);
        }
        return Promise.resolve({ error: null });
      },
      then: (onFulfilled: (value: unknown) => unknown, onRejected: (reason: unknown) => unknown) => {
        const matched = rows.filter(
          (row) =>
            (filters.isActive === undefined || row.is_active === filters.isActive) &&
            (filters.expiresLte === undefined ||
              (row.expires_at !== null && row.expires_at <= filters.expiresLte)),
        );
        return Promise.resolve({ data: matched.slice(0, limit).map((row) => ({ id: row.id })), error: null }).then(
          onFulfilled,
          onRejected,
        );
      },
    };

    return builder;
  });

  const client = { from };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(client);
  return { client, deleteCalls };
}

describe("apiKeyPrune (SEC-P2-017 / ACM-P2-005)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deactivates expired keys, deletes keys expired beyond the grace period, leaves live keys alone", async () => {
    const rows: Row[] = [
      { id: "expired-active", is_active: true, expires_at: daysAgo(2) },
      { id: "expired-inactive-old", is_active: false, expires_at: daysAgo(60) },
      { id: "expired-active-old", is_active: true, expires_at: daysAgo(90) },
      { id: "future-active", is_active: true, expires_at: daysAhead(1) },
      { id: "no-expiry", is_active: true, expires_at: null },
      { id: "revoked-no-expiry", is_active: false, expires_at: null },
    ];
    makeClient(rows);

    const res = await apiKeyPrune({});

    expect(res.ok).toBe(true);
    const byId = new Map(rows.map((row) => [row.id, row]));
    // Recently expired keys are deactivated but kept for the grace period.
    expect(byId.get("expired-active")?.is_active).toBe(false);
    // Long-expired keys are removed (active ones after deactivation).
    expect(byId.has("expired-inactive-old")).toBe(false);
    expect(byId.has("expired-active-old")).toBe(false);
    // Live / non-expiring / manually revoked keys are untouched.
    expect(byId.get("future-active")?.is_active).toBe(true);
    expect(byId.get("no-expiry")?.is_active).toBe(true);
    expect(byId.get("revoked-no-expiry")?.is_active).toBe(false);
  });

  it("deletes in bounded batches (no batch larger than the page size)", async () => {
    const rows: Row[] = Array.from({ length: 2500 }, (_, i) => ({
      id: `old-${i}`,
      is_active: false,
      expires_at: daysAgo(45),
    }));
    const { deleteCalls } = makeClient(rows);

    const res = await apiKeyPrune({});

    expect(res.ok).toBe(true);
    expect(rows).toHaveLength(0);
    // 2500 rows => 1000 + 1000 + 500.
    expect(deleteCalls).toHaveLength(3);
    for (const batch of deleteCalls) expect(batch.length).toBeLessThanOrEqual(1000);
  });

  it("returns ok:false when a write fails instead of claiming success", async () => {
    const rows: Row[] = [{ id: "expired-active", is_active: true, expires_at: daysAgo(2) }];
    makeClient(rows, { failUpdate: true });

    const res = await apiKeyPrune({});

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/permission denied/);
    // The failed deactivation must not delete anything.
    expect(rows).toHaveLength(1);
  });

  it("does nothing when there are no expired keys", async () => {
    const rows: Row[] = [
      { id: "future-active", is_active: true, expires_at: daysAhead(1) },
      { id: "no-expiry", is_active: true, expires_at: null },
    ];
    const { deleteCalls } = makeClient(rows);

    const res = await apiKeyPrune({});

    expect(res.ok).toBe(true);
    expect(deleteCalls).toHaveLength(0);
    expect(rows).toHaveLength(2);
  });
});
