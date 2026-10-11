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

// SEC-P2-001 / CHAIN-P2-010: monitoring checks must go through the pinned
// dispatcher, never the global fetch (guard-then-fetch DNS-rebinding TOCTOU).
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
const inserts: Array<{ table: string; row: Record<string, unknown> }> = [];

function makeChain(table: string) {
  const result: TableResult = tableResults[table] ?? {};
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "update", "eq", "in", "limit", "not", "order"]) {
    chain[method] = jest.fn().mockReturnThis();
  }
  chain.insert = jest.fn((row: Record<string, unknown>) => {
    inserts.push({ table, row });
    return chain;
  });
  chain.then = (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
    Promise.resolve({ data: result.data ?? null, error: result.error ?? null }).then(
      onFulfilled,
      onRejected,
    );
  return chain;
}

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => makeChain(table)),
  })),
}));

import tls from "node:tls";
import { fetchSslExpiry, websiteMonitorCheck } from "../../tasks/module-tasks";
import { pinnedFetch, resolvePinnedAddress } from "../../lib/pinned-fetch";
import { assertSafeUrl } from "../../lib/ssrf-guard";

const pinnedFetchMock = pinnedFetch as unknown as jest.Mock;
const resolvePinnedAddressMock = resolvePinnedAddress as unknown as jest.Mock;
const assertSafeUrlMock = assertSafeUrl as unknown as jest.Mock;
const tlsConnectMock = tls.connect as unknown as jest.Mock;

const realFetch = globalThis.fetch;

const uptimeCheck = {
  id: "check-1",
  url: "https://status.example.com/health",
  check_interval_minutes: 5,
  last_checked_at: null,
};

function stubGlobalFetch() {
  const fetchMock = jest.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("websiteMonitorCheck monitoring SSRF pinning", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    inserts.length = 0;
    for (const key of Object.keys(tableResults)) delete tableResults[key];
    assertSafeUrlMock.mockResolvedValue(null);
    // The TLS probe fails closed by default so these tests never open a socket.
    resolvePinnedAddressMock.mockRejectedValue(
      new Error("URL resolves to a private or loopback address"),
    );
    tlsConnectMock.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("sends due uptime checks through pinnedFetch, not global fetch [CHAIN-P2-010]", async () => {
    tableResults.uptime_checks = { data: [uptimeCheck] };
    tableResults.website_monitors = { data: [] };
    pinnedFetchMock.mockResolvedValue({ status: 200, text: jest.fn().mockResolvedValue("") });
    const fetchMock = stubGlobalFetch();

    const result = await websiteMonitorCheck({});
    expect(result).toEqual({ ok: true });

    expect(pinnedFetchMock).toHaveBeenCalledTimes(1);
    expect(pinnedFetchMock.mock.calls[0][0]).toBe(uptimeCheck.url);
    expect(pinnedFetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({ signal: expect.anything() }),
    );
    expect(fetchMock).not.toHaveBeenCalled();

    const row = inserts.find((i) => i.table === "uptime_results")?.row;
    expect(row).toMatchObject({ check_id: "check-1", response_status: 200, is_up: true });
  });

  it("records a rebinding attempt (public at guard, private at connect) as blocked [CHAIN-P2-010]", async () => {
    tableResults.uptime_checks = {
      data: [{ ...uptimeCheck, url: "https://evil-rebind.example/health" }],
    };
    tableResults.website_monitors = { data: [] };

    // The guard resolved the public answer (null = safe) but the pinned fetch
    // validates its own resolution and sees the loopback rebinding answer.
    pinnedFetchMock.mockRejectedValue(new Error("URL resolves to a private or loopback address"));
    const fetchMock = stubGlobalFetch();

    const result = await websiteMonitorCheck({});
    expect(result).toEqual({ ok: true });

    expect(pinnedFetchMock).toHaveBeenCalledWith(
      "https://evil-rebind.example/health",
      expect.anything(),
    );
    expect(fetchMock).not.toHaveBeenCalled();

    const row = inserts.find((i) => i.table === "uptime_results")?.row;
    expect(row).toMatchObject({ response_status: 0, is_up: false });
    expect(String(row?.error_message)).toMatch(/private or loopback/i);
  });

  it("sends website monitors through pinnedFetch too [CHAIN-P2-010]", async () => {
    // A not-yet-due uptime check keeps the handler past its empty-list
    // early return; the website monitor below is due.
    tableResults.uptime_checks = {
      data: [{ ...uptimeCheck, last_checked_at: new Date().toISOString() }],
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
    const html = "<html><head><title>Example site</title></head><body><h1>Hi</h1></body></html>";
    pinnedFetchMock.mockResolvedValue({ status: 200, text: jest.fn().mockResolvedValue(html) });
    const fetchMock = stubGlobalFetch();

    const result = await websiteMonitorCheck({});
    expect(result).toEqual({ ok: true });

    expect(pinnedFetchMock).toHaveBeenCalledTimes(1);
    expect(pinnedFetchMock.mock.calls[0][0]).toBe("https://site.example.com/");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("fetchSslExpiry TLS pinning", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tlsConnectMock.mockReset();
  });

  it("dials the validated address and keeps SNI on the original hostname [CHAIN-P2-010]", async () => {
    resolvePinnedAddressMock.mockResolvedValue({
      address: "93.184.216.34",
      family: 4,
    });
    const destroy = jest.fn();
    tlsConnectMock.mockImplementation((_options: unknown, callback: () => void) => {
      const socket = {
        getPeerCertificate: jest.fn(() => ({ valid_to: "2027-01-01T00:00:00.000Z" })),
        destroy,
        on: jest.fn(),
      };
      // Real tls.connect fires this after the socket is returned/assigned.
      process.nextTick(callback);
      return socket;
    });

    const ssl = await fetchSslExpiry("https://status.example.com/health");

    expect(resolvePinnedAddressMock).toHaveBeenCalledWith("https://status.example.com/health");
    expect(tlsConnectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "93.184.216.34",
        port: 443,
        servername: "status.example.com",
      }),
      expect.any(Function),
    );
    expect(ssl).toEqual({
      expires: "2027-01-01T00:00:00.000Z",
      daysRemaining: expect.any(Number),
    });
    expect(destroy).toHaveBeenCalled();
  });

  it("fails closed without a socket when the host resolves private [CHAIN-P2-010]", async () => {
    resolvePinnedAddressMock.mockRejectedValue(
      new Error("URL resolves to a private or loopback address"),
    );

    const ssl = await fetchSslExpiry("https://evil-rebind.example/health");

    expect(ssl).toBeNull();
    expect(tlsConnectMock).not.toHaveBeenCalled();
  });
});
