import { jest } from "@jest/globals";

jest.mock("pino", () => {
  const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  return jest.fn(() => mockLogger);
});

jest.mock("dotenv/config", () => ({}));

jest.mock("../../env", () => ({
  env: {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  },
}));

// The monitoring handlers must go through the pinned dispatcher (SSRF
// guard-then-fetch TOCTOU); the TLS probe fails closed by default so these
// tests never open a socket.
jest.mock("../../lib/pinned-fetch", () => ({
  pinnedFetch: jest.fn(),
  resolvePinnedAddress: jest.fn(),
}));

jest.mock("../../lib/ssrf-guard", () => ({
  assertSafeUrl: jest.fn().mockResolvedValue(null),
}));

jest.mock("node:tls", () => ({
  __esModule: true,
  default: { connect: jest.fn() },
}));

type TableResult = { data?: unknown; error?: { message: string } | null };

const tableResults: Record<string, TableResult> = {};
const updateResults: Record<string, TableResult> = {};
const inserts: Array<{ table: string; row: Record<string, unknown> }> = [];
const updates: Array<{ table: string; row: Record<string, unknown> }> = [];
const inCalls: Array<{ table: string; column: string; values: unknown }> = [];

/**
 * Chainable Supabase query stub. Each `.from(table)` gets its own chain, so a
 * select followed by an update on the same table can resolve differently
 * (tableResults vs updateResults).
 */
function makeChain(table: string) {
  let isUpdate = false;
  const chain: Record<string, unknown> = {};
  for (const method of [
    "select",
    "eq",
    "lt",
    "lte",
    "gt",
    "gte",
    "not",
    "or",
    "order",
    "range",
    "limit",
    "single",
    "maybeSingle",
  ]) {
    chain[method] = jest.fn().mockReturnThis();
  }
  chain.in = jest.fn((column: string, values: unknown) => {
    inCalls.push({ table, column, values });
    return chain;
  });
  chain.update = jest.fn((row: Record<string, unknown>) => {
    isUpdate = true;
    updates.push({ table, row });
    return chain;
  });
  chain.insert = jest.fn((row: Record<string, unknown>) => {
    inserts.push({ table, row });
    return chain;
  });
  chain.then = (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) => {
    const result = isUpdate ? (updateResults[table] ?? tableResults[table]) : tableResults[table];
    return Promise.resolve({
      data: result?.data ?? null,
      error: result?.error ?? null,
    }).then(onFulfilled, onRejected);
  };
  return chain;
}

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => makeChain(table)),
  })),
}));

import { assertSafeUrl } from "../../lib/ssrf-guard";
import { pinnedFetch, resolvePinnedAddress } from "../../lib/pinned-fetch";
import type { TaskHandler } from "../../task-registry";
import {
  backupDrCheck,
  dmarcCoachCheck,
  statusMaintenanceCheck,
  websiteMonitorCheck,
  domainMonitorCheck,
  patchComplianceCheck,
  endpointSecurityCheck,
} from "../../tasks/module-tasks";

const assertSafeUrlMock = assertSafeUrl as unknown as jest.Mock;
const pinnedFetchMock = pinnedFetch as unknown as jest.Mock;
const resolvePinnedAddressMock = resolvePinnedAddress as unknown as jest.Mock;

const realFetch = globalThis.fetch;

function resetState(): void {
  jest.clearAllMocks();
  for (const key of Object.keys(tableResults)) delete tableResults[key];
  for (const key of Object.keys(updateResults)) delete updateResults[key];
  inserts.length = 0;
  updates.length = 0;
  inCalls.length = 0;
  assertSafeUrlMock.mockResolvedValue(null);
  resolvePinnedAddressMock.mockRejectedValue(
    new Error("URL resolves to a private or loopback address"),
  );
  pinnedFetchMock.mockReset();
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

/**
 * The empty/error half of every scan handler is the same shape, so it is
 * generated from a table (TEST-P2-002). Handler-specific mutation assertions
 * live in the describe blocks below.
 */
function defineScanTaskSuite(config: {
  name: string;
  handler: TaskHandler;
  table: string;
  fetchError: string;
}): void {
  describe(config.name, () => {
    beforeEach(resetState);

    it("returns { ok: true } when there is nothing to process", async () => {
      tableResults[config.table] = { data: [] };
      expect(await config.handler({})).toEqual({ ok: true });
      expect(updates).toHaveLength(0);
    });

    it("returns { ok: false } when the fetch fails", async () => {
      tableResults[config.table] = { data: null, error: { message: "Fetch failed" } };
      const result = await config.handler({});
      expect(result.ok).toBe(false);
      expect(result.error).toBe(`${config.fetchError}: Fetch failed`);
    });
  });
}

defineScanTaskSuite({
  name: "backupDrCheck",
  handler: backupDrCheck,
  table: "backup_status",
  fetchError: "Failed to fetch backup_status records",
});

defineScanTaskSuite({
  name: "dmarcCoachCheck",
  handler: dmarcCoachCheck,
  table: "dmarc_analyses",
  fetchError: "Failed to fetch dmarc_analyses",
});

defineScanTaskSuite({
  name: "statusMaintenanceCheck",
  handler: statusMaintenanceCheck,
  table: "maintenance_notices",
  fetchError: "Failed to fetch maintenance_notices",
});

defineScanTaskSuite({
  name: "websiteMonitorCheck",
  handler: websiteMonitorCheck,
  table: "uptime_checks",
  fetchError: "Failed to fetch uptime_checks",
});

defineScanTaskSuite({
  name: "domainMonitorCheck",
  handler: domainMonitorCheck,
  table: "domain_monitors",
  fetchError: "Failed to fetch domain_monitors",
});

defineScanTaskSuite({
  name: "patchComplianceCheck",
  handler: patchComplianceCheck,
  table: "patch_compliance",
  fetchError: "Failed to fetch patch_compliance",
});

defineScanTaskSuite({
  name: "endpointSecurityCheck",
  handler: endpointSecurityCheck,
  table: "endpoint_security",
  fetchError: "Failed to fetch endpoint_security",
});

describe("backupDrCheck", () => {
  beforeEach(resetState);

  it("flags stale and missing backups as warning/critical", async () => {
    const now = Date.now();
    const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();
    tableResults.backup_status = {
      data: [
        { id: "fresh", last_backup_at: hoursAgo(1) },
        { id: "warn", last_backup_at: hoursAgo(36) },
        { id: "crit-old", last_backup_at: hoursAgo(72) },
        { id: "crit-null", last_backup_at: null },
      ],
    };

    const result = await backupDrCheck({});

    expect(result).toEqual({ ok: true });
    expect(updates).toEqual([
      { table: "backup_status", row: { status: "warning" } },
      { table: "backup_status", row: { status: "critical" } },
    ]);
    expect(inCalls).toEqual([
      { table: "backup_status", column: "id", values: ["warn"] },
      { table: "backup_status", column: "id", values: ["crit-old", "crit-null"] },
    ]);
  });
});

describe("dmarcCoachCheck", () => {
  beforeEach(resetState);

  it("marks stale analyses and reports the ids", async () => {
    tableResults.dmarc_analyses = { data: [{ id: "a1" }, { id: "a2" }] };

    const result = await dmarcCoachCheck({});

    expect(result).toEqual({ ok: true });
    expect(updates).toEqual([{ table: "dmarc_analyses", row: { status: "stale" } }]);
    expect(inCalls).toEqual([{ table: "dmarc_analyses", column: "id", values: ["a1", "a2"] }]);
  });

  it("returns { ok: false } when the update fails", async () => {
    tableResults.dmarc_analyses = { data: [{ id: "a1" }] };
    updateResults.dmarc_analyses = { error: { message: "Update failed" } };

    const result = await dmarcCoachCheck({});

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Failed to update dmarc_analyses: Update failed");
  });
});

describe("statusMaintenanceCheck", () => {
  beforeEach(resetState);

  it("moves imminent notices to upcoming", async () => {
    tableResults.maintenance_notices = { data: [{ id: "n1" }, { id: "n2" }] };

    const result = await statusMaintenanceCheck({});

    expect(result).toEqual({ ok: true });
    expect(updates).toEqual([{ table: "maintenance_notices", row: { status: "upcoming" } }]);
    expect(inCalls).toEqual([
      { table: "maintenance_notices", column: "id", values: ["n1", "n2"] },
    ]);
  });

  it("returns { ok: false } when the update fails", async () => {
    tableResults.maintenance_notices = { data: [{ id: "n1" }] };
    updateResults.maintenance_notices = { error: { message: "Update failed" } };

    const result = await statusMaintenanceCheck({});

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Failed to update maintenance_notices: Update failed");
  });
});

describe("websiteMonitorCheck", () => {
  beforeEach(resetState);

  const dueUptimeCheck = {
    id: "check-1",
    url: "https://status.example.com/health",
    check_interval_minutes: 5,
    last_checked_at: null,
  };

  it("records a due uptime check and stamps it as checked", async () => {
    tableResults.uptime_checks = { data: [dueUptimeCheck] };
    tableResults.website_monitors = { data: [] };
    pinnedFetchMock.mockResolvedValue({ status: 200, text: jest.fn().mockResolvedValue("") });

    const result = await websiteMonitorCheck({});

    expect(result).toEqual({ ok: true });
    expect(pinnedFetchMock).toHaveBeenCalledWith(dueUptimeCheck.url, expect.anything());
    expect(inserts).toEqual([
      {
        table: "uptime_results",
        row: expect.objectContaining({
          check_id: "check-1",
          response_status: 200,
          is_up: true,
          error_message: null,
        }),
      },
    ]);
    expect(updates).toEqual([
      {
        table: "uptime_checks",
        row: expect.objectContaining({ last_status_code: 200, last_checked_at: expect.any(String) }),
      },
    ]);
  });

  it("records a blocked URL without fetching it", async () => {
    tableResults.uptime_checks = { data: [dueUptimeCheck] };
    tableResults.website_monitors = { data: [] };
    assertSafeUrlMock.mockResolvedValue("URL resolves to a private or loopback address");

    const result = await websiteMonitorCheck({});

    expect(result).toEqual({ ok: true });
    expect(pinnedFetchMock).not.toHaveBeenCalled();
    expect(inserts[0]?.row).toMatchObject({
      check_id: "check-1",
      response_status: 0,
      is_up: false,
      error_message: "Blocked: URL resolves to a private or loopback address",
    });
  });

  it("skips checks that are not due", async () => {
    tableResults.uptime_checks = {
      data: [{ ...dueUptimeCheck, last_checked_at: new Date().toISOString() }],
    };
    tableResults.website_monitors = { data: [] };

    const result = await websiteMonitorCheck({});

    expect(result).toEqual({ ok: true });
    expect(pinnedFetchMock).not.toHaveBeenCalled();
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });

  it("audits due website monitors and stores the snapshot", async () => {
    // A not-yet-due uptime check keeps the handler past its early return; the
    // website monitor below is due.
    tableResults.uptime_checks = {
      data: [{ ...dueUptimeCheck, last_checked_at: new Date().toISOString() }],
    };
    tableResults.website_monitors = {
      data: [
        {
          id: "mon-1",
          url: "https://site.example.com/",
          check_interval_hours: 24,
          last_checked_at: null,
        },
      ],
    };
    const html =
      "<html><head><title>Example site</title></head><body><h1>Hi</h1></body></html>";
    pinnedFetchMock.mockResolvedValue({ status: 200, text: jest.fn().mockResolvedValue(html) });

    const result = await websiteMonitorCheck({});

    expect(result).toEqual({ ok: true });
    expect(pinnedFetchMock).toHaveBeenCalledWith("https://site.example.com/", expect.anything());
    expect(updates).toEqual([
      {
        table: "website_monitors",
        row: expect.objectContaining({
          last_status: "up",
          ssl_valid: false,
          seo_score: expect.any(Number),
          last_page_bytes: html.length,
        }),
      },
    ]);
  });
});

describe("domainMonitorCheck", () => {
  beforeEach(resetState);

  function dohResponse(records: string[]) {
    return {
      ok: true,
      json: async () => ({ Answer: records.map((data) => ({ data: `"${data}"` })) }),
    };
  }

  function stubDns() {
    globalThis.fetch = jest.fn(async (url: string) => {
      const u = String(url);
      if (u.includes("type=NS")) return dohResponse(["ns1.example.com."]) as unknown as Response;
      if (u.includes("_dmarc.")) return dohResponse(["v=DMARC1; p=reject"]) as unknown as Response;
      if (u.includes("_domainkey")) return dohResponse([]) as unknown as Response;
      return dohResponse(["v=spf1 include:_spf.example.com ~all"]) as unknown as Response;
    }) as unknown as typeof fetch;
  }

  it("stores the DNS/SSL snapshot and clears a matching nameserver set", async () => {
    tableResults.domain_monitors = {
      data: [{ id: "d1", domain: "example.com", nameservers: ["ns1.example.com"] }],
    };
    stubDns();

    const result = await domainMonitorCheck({});

    expect(result).toEqual({ ok: true });
    expect(updates).toEqual([
      {
        table: "domain_monitors",
        row: expect.objectContaining({
          spf_status: "present",
          dmarc_status: "present",
          dmarc_policy: "reject",
          nameserver_mismatch: false,
          ssl_valid: false,
        }),
      },
    ]);
    expect(inCalls).toHaveLength(0);
  });

  it("flags a nameserver mismatch when the stored set does not resolve", async () => {
    tableResults.domain_monitors = {
      data: [{ id: "d1", domain: "example.com", nameservers: ["ns9.example.com"] }],
    };
    stubDns();

    await domainMonitorCheck({});

    expect(updates[0]?.row).toMatchObject({ nameserver_mismatch: true });
  });

  it("stores unknowns for a blocked domain without resolving DNS", async () => {
    tableResults.domain_monitors = {
      data: [{ id: "d1", domain: "internal.example", nameservers: [] }],
    };
    assertSafeUrlMock.mockResolvedValue("URL resolves to a private or loopback address");
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await domainMonitorCheck({});

    expect(result).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(updates[0]?.row).toMatchObject({
      spf_status: "unknown",
      dmarc_status: "unknown",
      dmarc_policy: null,
      ssl_valid: false,
    });
  });
});

describe("patchComplianceCheck", () => {
  beforeEach(resetState);

  it("stamps every active record as checked", async () => {
    tableResults.patch_compliance = {
      data: [
        { id: "p1", total_devices: 10, patched_devices: 5 },
        { id: "p2", total_devices: 10, patched_devices: 10 },
      ],
    };

    const result = await patchComplianceCheck({});

    expect(result).toEqual({ ok: true });
    expect(updates).toEqual([
      { table: "patch_compliance", row: { last_checked_at: expect.any(String) } },
    ]);
    expect(inCalls).toEqual([{ table: "patch_compliance", column: "id", values: ["p1", "p2"] }]);
  });

  it("returns { ok: false } when the update fails", async () => {
    tableResults.patch_compliance = { data: [{ id: "p1" }] };
    updateResults.patch_compliance = { error: { message: "Update failed" } };

    const result = await patchComplianceCheck({});

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Failed to update patch_compliance: Update failed");
  });
});

describe("endpointSecurityCheck", () => {
  beforeEach(resetState);

  it("stamps every active record as checked", async () => {
    tableResults.endpoint_security = {
      data: [
        { id: "e1", total_endpoints: 20, av_installed: 4 },
        { id: "e2", total_endpoints: 20, av_installed: 20 },
      ],
    };

    const result = await endpointSecurityCheck({});

    expect(result).toEqual({ ok: true });
    expect(updates).toEqual([
      { table: "endpoint_security", row: { last_checked_at: expect.any(String) } },
    ]);
    expect(inCalls).toEqual([{ table: "endpoint_security", column: "id", values: ["e1", "e2"] }]);
  });

  it("returns { ok: false } when the update fails", async () => {
    tableResults.endpoint_security = { data: [{ id: "e1" }] };
    updateResults.endpoint_security = { error: { message: "Update failed" } };

    const result = await endpointSecurityCheck({});

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Failed to update endpoint_security: Update failed");
  });
});
