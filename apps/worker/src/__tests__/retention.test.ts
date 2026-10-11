import { jest } from "@jest/globals";

/**
 * Regression tests for the retention task.
 *
 * DATA-P1-002: the original implementation issued a single unbounded
 * `.delete()` per table, never counted what it removed, and returned
 * `{ ok: true }` even when a purge errored.
 *
 * DATA-P2-005: audit rows are now archived before deletion via the
 * `archive_audit_logs` DB function (5302440).
 *
 * DATA-P2-006: purge windows are resolved from the `retention_policies`
 * registry before falling back to the built-in defaults.
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

<<<<<<< HEAD
type Row = {
  id: string;
  created_at?: string;
  organization_id?: string;
  system_name?: string;
  data_category?: string | null;
  retention_period_days?: number | null;
};
type TableState = Record<string, Row[]>;

interface MockOpts {
  failOn?: string;
  failRpc?: string;
  failPolicies?: boolean;
}

function makeSupabase(state: TableState, opts: MockOpts = {}) {
  const rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = [];

  function from(table: string) {
    const api = {
      _cutoff: null as string | null,
      select(_cols?: string) {
        return api;
      },
      delete() {
        return api;
      },
      eq(_col: string, _value: unknown) {
        return api;
      },
      lt(_col: string, cutoff: string) {
        api._cutoff = cutoff;
        return api;
      },
      limit(n: number) {
        const rows = (state[table] ?? [])
          .filter((r) => (api._cutoff ? !r.created_at || r.created_at < api._cutoff : true))
          .slice(0, n);
        return Promise.resolve({ data: rows, error: null });
      },
      in(_col: string, ids: string[]) {
        if (opts.failOn === table) {
          return Promise.resolve({ data: null, error: { message: "permission denied" } });
        }
        state[table] = (state[table] ?? []).filter((r) => !ids.includes(r.id));
        return Promise.resolve({ data: null, error: null });
      },
      then(resolve: (value: { data: Row[]; error: null }) => unknown) {
        if (table === "retention_policies" && opts.failPolicies) {
          return Promise.resolve({
            data: [],
            error: { message: "registry unavailable" },
          }).then(resolve);
        }
        return Promise.resolve({ data: state[table] ?? [], error: null }).then(resolve);
      },
    };
    return api;
  }

  function rpc(fn: string, args: Record<string, unknown>) {
    rpcCalls.push({ fn, args });
    if (opts.failRpc === fn) {
      return Promise.resolve({ data: null, error: { message: "archive denied" } });
    }
    if (fn === "archive_audit_logs") {
      const cutoff = String(args.p_cutoff ?? "");
      const org = typeof args.p_organization_id === "string" ? args.p_organization_id : null;
      const rows = state.audit_logs ?? [];
      const expired = rows.filter(
        (r) =>
          (!r.created_at || r.created_at < cutoff) &&
          (org === null || r.organization_id === org),
      );
      state.audit_logs = rows.filter((r) => !expired.includes(r));
      state.audit_log_archive = [...(state.audit_log_archive ?? []), ...expired];
      return Promise.resolve({ data: expired.length, error: null });
    }
    return Promise.resolve({ data: 0, error: null });
  }

  return { from, rpc, rpcCalls };
=======
type Row = { id: string; created_at?: string };
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
          const rows = (state[table] ?? [])
            .filter((r) => (api._cutoff && r.created_at ? r.created_at < api._cutoff : true))
            .slice(0, n);
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
>>>>>>> 73c604c4 (fix(analytics): drop visitor PII, wire storefront capture, retention + admin summary (AN-P2-002/003/004, FEAT-P2-003))
}

const rows = (n: number): Row[] => Array.from({ length: n }, (_, i) => ({ id: `id-${i}` }));

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

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
import { resolveRetentionDays } from "../lib/retention-policy";

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

<<<<<<< HEAD
  it("archives audit rows before deleting them and batches notification deletes", async () => {
    const state: TableState = { audit_logs: rows(2500), notifications: rows(10) };
    const supabase = makeSupabase(state);
    (createClient as unknown as jest.Mock).mockReturnValue(supabase);
=======
  it("refuses a non-positive store analytics window (AN-P2-004)", async () => {
    const res = await retentionTask({ storeAnalyticsRetentionDays: 0 });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/storeAnalyticsRetentionDays must be a positive number of days/);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("deletes in bounded batches and reports the real count", async () => {
    const state: TableState = {
      audit_logs: rows(2500),
      notifications: rows(10),
      store_analytics_events: rows(5),
    };
    (createClient as unknown as jest.Mock).mockReturnValue(makeSupabase(state));
>>>>>>> 73c604c4 (fix(analytics): drop visitor PII, wire storefront capture, retention + admin summary (AN-P2-002/003/004, FEAT-P2-003))

    const res = await retentionTask({});

    expect(res.ok).toBe(true);
    // The audit purge goes through the archive RPC, not a bare delete.
    expect(supabase.rpcCalls).toHaveLength(1);
    expect(supabase.rpcCalls[0].fn).toBe("archive_audit_logs");
    expect(supabase.rpcCalls[0].args).toMatchObject({
      p_cutoff: expect.any(String),
      p_batch_size: 1000,
      p_max_batches: 200,
    });
    expect(state.audit_logs).toHaveLength(0);
    expect(state.audit_log_archive).toHaveLength(2500);
    // Notifications still use bounded batches (1000 + 1000 + 500 would be 2500;
    // 10 rows means one short batch).
    expect(state.notifications).toHaveLength(0);
    expect(state.store_analytics_events).toHaveLength(0);
  });

  it("purges store analytics events older than the cutoff (AN-P2-004)", async () => {
    const old = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();
    const recent = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const state: TableState = {
      audit_logs: [],
      notifications: [],
      store_analytics_events: [
        { id: "old-1", created_at: old },
        { id: "recent-1", created_at: recent },
      ],
    };
    (createClient as unknown as jest.Mock).mockReturnValue(makeSupabase(state));

    const res = await retentionTask({});

    expect(res.ok).toBe(true);
    expect(state.store_analytics_events.map((row) => row.id)).toEqual(["recent-1"]);
  });

  it("returns ok:false and keeps the rows when the audit archive fails", async () => {
    const state: TableState = { audit_logs: rows(100), notifications: [] };
    const supabase = makeSupabase(state, { failRpc: "archive_audit_logs" });
    (createClient as unknown as jest.Mock).mockReturnValue(supabase);

    const res = await retentionTask({});

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/archive denied/);
    // A failed archive must never be followed by a delete (DATA-P2-005).
    expect(state.audit_logs).toHaveLength(100);
  });

  it("returns ok:false when a purge fails (was ok:true before the fix)", async () => {
    const state: TableState = { audit_logs: [], notifications: rows(100) };
    const supabase = makeSupabase(state, { failOn: "notifications" });
    (createClient as unknown as jest.Mock).mockReturnValue(supabase);

    const res = await retentionTask({});

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/permission denied/);
  });

  it("does not delete when there is nothing past the cutoff", async () => {
    const state: TableState = { audit_logs: [], notifications: [] };
    const supabase = makeSupabase(state);
    (createClient as unknown as jest.Mock).mockReturnValue(supabase);

    const res = await retentionTask({});
    expect(res.ok).toBe(true);
    expect(state.audit_logs).toHaveLength(0);
    expect(state.notifications).toHaveLength(0);
  });
});

describe("retentionTask policy windows (DATA-P2-006)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses matching retention_policies windows instead of the defaults", async () => {
    const state: TableState = {
      audit_logs: [
        { id: "audit-old", created_at: daysAgo(100) },
        { id: "audit-recent", created_at: daysAgo(10) },
      ],
      notifications: [
        { id: "notif-old", created_at: daysAgo(60) },
        { id: "notif-recent", created_at: daysAgo(5) },
      ],
      retention_policies: [
        {
          id: "p1",
          created_at: daysAgo(1),
          organization_id: "org-1",
          system_name: "audit_logs",
          data_category: "Security Audit Logs",
          retention_period_days: 30,
        },
        {
          id: "p2",
          created_at: daysAgo(1),
          organization_id: "org-1",
          system_name: "notifications",
          data_category: "Notification Delivery",
          retention_period_days: 45,
        },
      ],
    };
    const supabase = makeSupabase(state);
    (createClient as unknown as jest.Mock).mockReturnValue(supabase);

    const res = await retentionTask({});

    expect(res.ok).toBe(true);
    // 30-day audit policy archives the 100-day row and keeps the 10-day one
    // (the 365-day default would have kept both).
    expect(state.audit_log_archive?.map((r) => r.id)).toEqual(["audit-old"]);
    expect(state.audit_logs.map((r) => r.id)).toEqual(["audit-recent"]);
    // 45-day notification policy removes the 60-day row and keeps the 5-day one
    // (the 90-day default would have kept both).
    expect(state.notifications.map((r) => r.id)).toEqual(["notif-recent"]);

    const cutoffMs = new Date(String(supabase.rpcCalls[0].args.p_cutoff)).getTime();
    const cutoffDays = (Date.now() - cutoffMs) / (24 * 60 * 60 * 1000);
    expect(cutoffDays).toBeGreaterThan(29);
    expect(cutoffDays).toBeLessThan(31);
  });

  it("falls back to the built-in window when the registry read fails", async () => {
    const state: TableState = {
      audit_logs: [{ id: "audit-old", created_at: daysAgo(400) }],
      notifications: [],
    };
    const supabase = makeSupabase(state, { failPolicies: true });
    (createClient as unknown as jest.Mock).mockReturnValue(supabase);

    const res = await retentionTask({});

    expect(res.ok).toBe(true);
    // Default is 365 days, so the 400-day-old row is archived.
    expect(state.audit_log_archive?.map((r) => r.id)).toEqual(["audit-old"]);
  });

  it("lets an explicit payload override win over the registry", async () => {
    const state: TableState = {
      audit_logs: [{ id: "audit-old", created_at: daysAgo(40) }],
      notifications: [],
      retention_policies: [
        {
          id: "p1",
          created_at: daysAgo(1),
          organization_id: "org-1",
          system_name: "audit_logs",
          data_category: "Security Audit Logs",
          retention_period_days: 365,
        },
      ],
    };
    const supabase = makeSupabase(state);
    (createClient as unknown as jest.Mock).mockReturnValue(supabase);

    const res = await retentionTask({ auditLogRetentionDays: 30 });

    expect(res.ok).toBe(true);
    expect(state.audit_log_archive?.map((r) => r.id)).toEqual(["audit-old"]);
  });
});

describe("resolveRetentionDays (DATA-P2-006)", () => {
  it("uses the longest matching policy window", () => {
    const policies = [
      { system_name: "audit_logs", data_category: null, retention_period_days: 90 },
      { system_name: null, data_category: "Security Audit Logs", retention_period_days: 365 },
    ];
    expect(resolveRetentionDays("audit_logs", 30, policies)).toEqual({
      days: 365,
      source: "policy",
      matchingPolicies: 2,
    });
  });

  it("ignores non-positive policy windows", () => {
    const policies = [
      { system_name: "audit_logs", data_category: null, retention_period_days: 0 },
      { system_name: "audit_logs", data_category: null, retention_period_days: -30 },
    ];
    expect(resolveRetentionDays("audit_logs", 365, policies)).toEqual({
      days: 365,
      source: "default",
      matchingPolicies: 0,
    });
  });

  it("does not match unrelated policies", () => {
    const policies = [
      { system_name: "EHR", data_category: "Patient Records", retention_period_days: 2555 },
    ];
    expect(resolveRetentionDays("audit_logs", 365, policies).source).toBe("default");
  });

  it("matches a public-interactions policy by data category", () => {
    const policies = [
      {
        system_name: "Contact Form",
        data_category: "Public Interactions",
        retention_period_days: 30,
      },
    ];
    expect(resolveRetentionDays("public_interactions", 90, policies).days).toBe(30);
  });
});
