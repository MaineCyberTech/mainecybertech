import { jest } from "@jest/globals";

jest.mock("pino", () => {
  const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  return jest.fn(() => mockLogger);
});

jest.mock("dotenv/config", () => ({}));

// No REDIS_URL -> the in-memory idempotency fallback is used.
jest.mock("../env", () => ({
  env: {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  },
  resolveRedisUrl: (url: string) => url,
}));

jest.mock("../lib/ssrf-guard", () => ({
  assertSafeUrl: jest.fn().mockResolvedValue(null),
}));

// SEC-P2-002: delivery now goes through pinnedFetch (pins the validated DNS
// answer) instead of global fetch.
jest.mock("../lib/pinned-fetch", () => ({
  pinnedFetch: jest.fn(),
}));

const endpoint = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "Worker endpoint",
  url: "https://example.test/hook",
  secret: null,
  events: ["ticket.created"],
};

const deliveryInserts: Array<Record<string, unknown>> = [];

function makeChain(terminal: "endpoints" | "other") {
  const chain: Record<string, unknown> = {};
  const passthrough = [
    "select",
    "eq",
    "contains",
    "update",
    "insert",
    "not",
    "lt",
    "or",
    "order",
    "limit",
  ];
  for (const m of passthrough) {
    chain[m] = jest.fn().mockReturnThis();
  }
  chain.insert = jest.fn((row: Record<string, unknown>) => {
    deliveryInserts.push(row);
    return Promise.resolve({ error: null });
  });
  chain.then = (onFulfilled: (v: unknown) => unknown, onRejected: (e: unknown) => unknown) =>
    Promise.resolve({ data: terminal === "endpoints" ? [endpoint] : null, error: null }).then(
      onFulfilled,
      onRejected,
    );
  return chain;
}

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(() => ({
    from: jest.fn((table: string) =>
      makeChain(table === "webhook_endpoints" ? "endpoints" : "other"),
    ),
  })),
}));

import { webhookDispatcher } from "../tasks/webhook-dispatcher";
import { pinnedFetch } from "../lib/pinned-fetch";

const fetchMock = pinnedFetch as unknown as jest.Mock;

describe("worker webhookDispatcher idempotency", () => {
  const data = { ticketId: "t-1" };

  beforeEach(() => {
    deliveryInserts.length = 0;
    fetchMock.mockReset();
  });

  it("sends an Idempotency-Key header and persists it on the delivery row", async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      text: jest.fn().mockResolvedValue("ok"),
    });

    // Key passed explicitly by the producer.
    const baseKey = "wh-out-explicit-key";
    const result = await webhookDispatcher({
      event: "ticket.created",
      organizationId: "org-1",
      data,
      idempotencyKey: baseKey,
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    const expectedKey = `${baseKey}:${endpoint.id}`;
    expect(init.headers["Idempotency-Key"]).toBe(expectedKey);
    expect(deliveryInserts).toHaveLength(1);
    expect(deliveryInserts[0].idempotency_key).toBe(expectedKey);
  });

  it("collapses a duplicate job for the same event to a single delivery", async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      text: jest.fn().mockResolvedValue("ok"),
    });

    const baseKey = "wh-out-shared-key";
    const payload = {
      event: "ticket.created",
      organizationId: "org-1",
      data,
      idempotencyKey: baseKey,
    };
    await Promise.all([webhookDispatcher(payload), webhookDispatcher(payload)]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(deliveryInserts).toHaveLength(1);
  });
});
