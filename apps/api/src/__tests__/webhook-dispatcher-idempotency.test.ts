import { jest } from "@jest/globals";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
  }),
}));

jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock("../lib/task-producer", () => ({
  // Force the inline fallback path.
  enqueueTask: jest.fn().mockResolvedValue(false),
}));

jest.mock("../lib/ssrf-guard", () => ({
  assertSafeWebhookUrl: jest.fn().mockResolvedValue(undefined),
}));

const endpoint = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Test endpoint",
  url: "https://example.test/hook",
  secret: null,
  events: ["ticket.created"],
};

const deliveryInserts: Array<Record<string, unknown>> = [];
const endpointUpdates: Array<Record<string, unknown>> = [];

function makeChain(terminal: "endpoints" | "deliveries" | "updates") {
  const chain: Record<string, unknown> = {};
  const passthrough = ["select", "eq", "contains", "update", "order", "limit"];
  for (const m of passthrough) {
    chain[m] = jest.fn().mockReturnThis();
  }
  chain.insert = jest.fn((row: Record<string, unknown>) => {
    if (terminal === "deliveries") deliveryInserts.push(row);
    return Promise.resolve({ error: null });
  });
  chain.then = (
    onFulfilled: (v: unknown) => unknown,
    onRejected: (e: unknown) => unknown,
  ) => Promise.resolve({ data: terminal === "endpoints" ? [endpoint] : null, error: null }).then(
    onFulfilled,
    onRejected,
  );
  return chain;
}

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === "webhook_endpoints") return makeChain("endpoints");
      if (table === "webhook_deliveries") return makeChain("deliveries");
      if (table === "webhook_dead_letters") return makeChain("deliveries");
      return makeChain("updates");
    }),
  })),
}));

import { dispatchWebhook, buildOutboundIdempotencyKey } from "../lib/webhook-dispatcher";
import { deleteIdempotencyKey } from "../lib/idempotency";

function okFetch() {
  const fetchMock = jest.fn().mockResolvedValue({
    status: 200,
    text: jest.fn().mockResolvedValue("ok"),
  });
  (global as unknown as { fetch: unknown }).fetch = fetchMock;
  return fetchMock;
}

describe("dispatchWebhook outbound idempotency", () => {
  const data = { ticketId: "t-1", title: "Hello" };

  beforeEach(async () => {
    deliveryInserts.length = 0;
    endpointUpdates.length = 0;
    await deleteIdempotencyKey(
      `${buildOutboundIdempotencyKey("ticket.created", "org-1", data)}:${endpoint.id}`,
    );
  });

  it("derives a stable key independent of the dispatch timestamp", () => {
    const a = buildOutboundIdempotencyKey("ticket.created", "org-1", data);
    const b = buildOutboundIdempotencyKey("ticket.created", "org-1", data);
    expect(a).toBe(b);
    expect(buildOutboundIdempotencyKey("ticket.created", "org-1", { ticketId: "other" })).not.toBe(a);
  });

  it("collapses concurrent duplicate dispatches to a single delivery", async () => {
    const fetchMock = okFetch();
    await Promise.all([
      dispatchWebhook("ticket.created", "org-1", data),
      dispatchWebhook("ticket.created", "org-1", data),
      dispatchWebhook("ticket.created", "org-1", data),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(deliveryInserts).toHaveLength(1);
    expect(deliveryInserts[0].idempotency_key).toBe(
      `${buildOutboundIdempotencyKey("ticket.created", "org-1", data)}:${endpoint.id}`,
    );
  });

  it("sends the Idempotency-Key header matching the persisted key", async () => {
    const fetchMock = okFetch();
    await dispatchWebhook("ticket.created", "org-1", data);
    const [, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(init.headers["Idempotency-Key"]).toBe(deliveryInserts[0].idempotency_key);
  });

  it("releases the claim on failure so a later retry can proceed", async () => {
    const fail = jest.fn().mockResolvedValue({
      status: 500,
      text: jest.fn().mockResolvedValue("boom"),
    });
    (global as unknown as { fetch: unknown }).fetch = fail;

    await dispatchWebhook("ticket.created", "org-1", data);

    const ok = okFetch();
    await dispatchWebhook("ticket.created", "org-1", data);
    expect(ok).toHaveBeenCalledTimes(1);
  });
});
