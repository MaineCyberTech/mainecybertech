import { jest } from "@jest/globals";
import { webhookRetry } from "../tasks/webhook-retry";

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

jest.mock("../lib/ssrf-guard", () => ({
  assertSafeUrl: jest.fn().mockResolvedValue(null),
}));

jest.mock("../lib/pinned-fetch", () => ({
  pinnedFetch: jest.fn(),
}));

jest.mock("../metrics", () => ({
  recordWebhookDelivery: jest.fn(),
  recordWebhookDeadLetter: jest.fn(),
}));

type DeliveryRow = {
  id: string;
  webhook_id: string | null;
  event: string;
  request_body: unknown;
  error: string | null;
  retry_count: number;
  next_retry_at: string | null;
  dead_letter: boolean;
  idempotency_key: string | null;
  status: string;
};

type EndpointRow = {
  id: string;
  url: string;
  secret: string | null;
  is_active: boolean;
};

type Store = {
  deliveries: DeliveryRow[];
  endpoint: EndpointRow | null;
  fetchError: { message: string } | null;
  deliveryUpdates: Array<Record<string, unknown>>;
  deadLetterInserts: Array<Record<string, unknown>>;
};

function emptyStore(): Store {
  return {
    deliveries: [],
    endpoint: null,
    fetchError: null,
    deliveryUpdates: [],
    deadLetterInserts: [],
  };
}

let store: Store = emptyStore();

/**
 * Minimal PostgREST-shaped fake. It models the one behaviour the retry task
 * depends on: an `update` is applied only when the row still matches the
 * filters (id / retry_count / next_retry_at), which is what makes the
 * WH-P2-012 claim atomic under concurrency.
 */
function createBuilder(table: string): any {
  const filters: Record<string, unknown> = {};
  let updateValues: Record<string, unknown> | null = null;
  let insertValues: Record<string, unknown> | null = null;

  const applyDeliveryUpdate = (values: Record<string, unknown>) => {
    const row = store.deliveries.find((delivery) => delivery.id === filters["id"]);
    if (!row) return { data: null, error: null };
    if ("retry_count" in filters && filters["retry_count"] !== row.retry_count) {
      return { data: null, error: null };
    }
    if ("next_retry_at" in filters && filters["next_retry_at"] !== row.next_retry_at) {
      return { data: null, error: null };
    }
    Object.assign(row, values);
    store.deliveryUpdates.push({ ...values });
    return { data: { id: row.id }, error: null };
  };

  const resolve = (): { data: unknown; error: unknown } => {
    if (table === "webhook_deliveries") {
      if (updateValues) return applyDeliveryUpdate(updateValues);
      return {
        data: store.fetchError ? null : store.deliveries.map((delivery) => ({ ...delivery })),
        error: store.fetchError,
      };
    }
    if (table === "webhook_endpoints") {
      return { data: updateValues ? null : store.endpoint, error: null };
    }
    if (table === "webhook_dead_letters" && insertValues) {
      store.deadLetterInserts.push({ ...insertValues });
    }
    return { data: null, error: null };
  };

  const builder: any = {};
  const passthrough = ["select", "not", "lt", "lte", "order", "limit", "range", "in", "contains"];
  for (const method of passthrough) {
    builder[method] = jest.fn(() => builder);
  }
  builder.eq = jest.fn((column: string, value: unknown) => {
    filters[column] = value;
    return builder;
  });
  builder.is = jest.fn((column: string, value: unknown) => {
    filters[column] = value;
    return builder;
  });
  builder.or = jest.fn(() => builder);
  builder.update = jest.fn((values: Record<string, unknown>) => {
    updateValues = values;
    return builder;
  });
  builder.insert = jest.fn((values: Record<string, unknown>) => {
    insertValues = values;
    return builder;
  });
  builder.delete = jest.fn(() => builder);
  builder.maybeSingle = jest.fn(async () => resolve());
  builder.single = jest.fn(async () => resolve());
  builder.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected: (reason: unknown) => unknown,
  ) => Promise.resolve(resolve()).then(onFulfilled, onRejected);
  return builder;
}

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(() => ({
    from: jest.fn((table: string) => createBuilder(table)),
  })),
}));

import { pinnedFetch } from "../lib/pinned-fetch";
import { recordWebhookDeadLetter } from "../metrics";

const fetchMock = pinnedFetch as unknown as jest.Mock;

function dueDelivery(overrides: Partial<DeliveryRow> = {}): DeliveryRow {
  return {
    id: "d1",
    webhook_id: "wh1",
    event: "ticket.created",
    request_body: { event: "ticket.created", data: { ticketId: "t1" } },
    error: "HTTP 500",
    retry_count: 0,
    next_retry_at: "2026-09-01T09:00:00.000Z",
    dead_letter: false,
    idempotency_key: "wh-out-key:wh1",
    status: "failed",
    ...overrides,
  };
}

describe("webhookRetry task", () => {
  beforeEach(() => {
    store = emptyStore();
    jest.clearAllMocks();
    fetchMock.mockReset();
  });

  it("returns { ok: true } when no deliveries to retry", async () => {
    const result = await webhookRetry({});
    expect(result).toEqual({ ok: true });
  });

  it("returns { ok: false } when the database query fails", async () => {
    store.fetchError = { message: "Database error" };
    const result = await webhookRetry({});
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Database error");
  });

  it("re-creates the dead letter with a reason when a row has no payload to replay [WH-P2-011]", async () => {
    store.deliveries = [
      dueDelivery({
        request_body: { event: "ticket.created", receivedAt: "2026-09-01T09:00:00.000Z" },
        idempotency_key: null,
      }),
    ];
    store.endpoint = { id: "wh1", url: "https://example.com/hook", secret: null, is_active: true };

    const result = await webhookRetry({});

    expect(result).toEqual({ ok: true });
    // No replay is attempted — but the delivery must not vanish from the DLQ.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.deliveries[0].dead_letter).toBe(true);
    expect(store.deliveries[0].next_retry_at).toBeNull();
    expect(store.deadLetterInserts).toHaveLength(1);
    expect(store.deadLetterInserts[0]).toMatchObject({
      webhook_id: "wh1",
      event: "ticket.created",
      request_body: { event: "ticket.created", receivedAt: "2026-09-01T09:00:00.000Z" },
    });
    expect(String(store.deadLetterInserts[0].last_error)).toContain("Not replayable");
    expect(recordWebhookDeadLetter).toHaveBeenCalledWith("ticket.created");
  });

  it("collapses concurrent retry runs to a single send [WH-P2-012]", async () => {
    store.deliveries = [dueDelivery()];
    store.endpoint = { id: "wh1", url: "https://example.com/hook", secret: null, is_active: true };
    fetchMock.mockResolvedValue({ status: 200, text: jest.fn().mockResolvedValue("ok") });

    await Promise.all([webhookRetry({}), webhookRetry({})]);

    // Only the run that won the row claim may send.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(store.deliveries[0].status).toBe("success");
    expect(store.deadLetterInserts).toHaveLength(0);
  });

  it("sends a retried delivery once when a single run owns the claim", async () => {
    store.deliveries = [dueDelivery()];
    store.endpoint = { id: "wh1", url: "https://example.com/hook", secret: null, is_active: true };
    fetchMock.mockResolvedValue({ status: 200, text: jest.fn().mockResolvedValue("ok") });

    const result = await webhookRetry({});

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(init.headers["Idempotency-Key"]).toBe("wh-out-key:wh1");
    // The claim lease is overwritten by the terminal success update.
    expect(store.deliveries[0].next_retry_at).toBeNull();
    expect(store.deliveries[0].retry_count).toBe(1);
  });

  it("replays the stored envelope verbatim, including its timestamp [WH-P3-005]", async () => {
    const requestBody = {
      event: "ticket.created",
      timestamp: "2026-09-01T09:00:00.000Z",
      data: { ticketId: "t1" },
    };
    store.deliveries = [dueDelivery({ request_body: requestBody })];
    store.endpoint = { id: "wh1", url: "https://example.com/hook", secret: null, is_active: true };
    fetchMock.mockResolvedValue({ status: 200, text: jest.fn().mockResolvedValue("ok") });

    const result = await webhookRetry({});

    expect(result).toEqual({ ok: true });
    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    // The retry body must equal the first attempt's body byte-for-byte.
    expect(init.body).toBe(JSON.stringify(requestBody));
  });

  it("claims legacy rows whose next_retry_at is null before sending", async () => {
    store.deliveries = [dueDelivery({ next_retry_at: null })];
    store.endpoint = { id: "wh1", url: "https://example.com/hook", secret: null, is_active: true };
    fetchMock.mockResolvedValue({ status: 200, text: jest.fn().mockResolvedValue("ok") });

    const result = await webhookRetry({});

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(store.deliveries[0].status).toBe("success");
  });
});
