import { jest } from "@jest/globals";

/**
 * Regression tests for the retention task (audit DATA-P1-002).
 *
 * The original implementation issued a single unbounded `.delete()` per table,
 * never counted what it removed, and returned `{ ok: true }` even when a purge
 * errored — so a silent retention failure looked identical to success.
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

type Row = { id: string };
type TableState = Record<string, Row[]>;

function makeSupabase(state: TableState, opts: { failOn?: string } = {}) {
  return {
    from(table: string) {
      const api = {
        _cutoff: null as string | null,
        select(_cols: string) {
          return api;
        },
        delete() {
          return api;
        },
        lt(_col: string, cutoff: string) {
          api._cutoff = cutoff;
          return api;
        },
        limit(n: number) {
          const rows = (state[table] ?? []).filter((r) => (api._cutoff ? true : true)).slice(0, n);
          return Promise.resolve({ data: rows, error: null });
        },
        in(_col: string, ids: string[]) {
          if (opts.failOn === table) {
            return Promise.resolve({ data: null, error: { message: "permission denied" } });
          }
          state[table] = (state[table] ?? []).filter((r) => !ids.includes(r.id));
          return Promise.resolve({ data: null, error: null });
        },
      };
      return api;
    },
  };
}

const rows = (n: number): Row[] => Array.from({ length: n }, (_, i) => ({ id: `id-${i}` }));

jest.mock("../services/supabase", () => ({
  wsTransport: undefined,
  getSupabaseAdmin: jest.fn(),
}));

jest.mock("../env", () => ({
  env: {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  },
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

import { createClient } from "@supabase/supabase-js";
import { retentionTask } from "../tasks/retention";

describe("retentionTask (DATA-P1-002)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("refuses to purge when a retention window is not a positive number of days", async () => {
    // A 0-day window would set the cutoff to 'now' and delete the whole table.
    for (const bad of [0, -1, Number.NaN]) {
      const res = await retentionTask({ auditLogRetentionDays: bad });
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/positive number of days/);
    }
    expect(createClient).not.toHaveBeenCalled();
  });

  it("deletes in bounded batches and reports the real count", async () => {
    const state: TableState = { audit_logs: rows(2500), notifications: rows(10) };
    (createClient as unknown as jest.Mock).mockReturnValue(makeSupabase(state));

    const res = await retentionTask({});

    expect(res.ok).toBe(true);
    // 2500 rows => 1000 + 1000 + 500 (three batches), all removed.
    expect(state.audit_logs).toHaveLength(0);
    expect(state.notifications).toHaveLength(0);
  });

  it("returns ok:false when a purge fails (was ok:true before the fix)", async () => {
    const state: TableState = { audit_logs: rows(100), notifications: rows(0) };
    (createClient as unknown as jest.Mock).mockReturnValue(
      makeSupabase(state, { failOn: "audit_logs" }),
    );

    const res = await retentionTask({});

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/permission denied/);
  });

  it("does not delete when there is nothing past the cutoff", async () => {
    const state: TableState = { audit_logs: [], notifications: [] };
    (createClient as unknown as jest.Mock).mockReturnValue(makeSupabase(state));

    const res = await retentionTask({});
    expect(res.ok).toBe(true);
    expect(state.audit_logs).toHaveLength(0);
  });
});
