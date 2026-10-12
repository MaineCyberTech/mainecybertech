import { jest } from "@jest/globals";

jest.mock("../config/env", () => ({
  getEnv: jest.fn(),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

jest.mock("../lib/logger", () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock("../lib/email", () => ({ sendEmail: jest.fn() }));

jest.mock("../lib/task-producer", () => ({
  enqueueTask: jest.fn(),
}));

jest.mock("../lib/idempotency", () => ({
  claimIdempotencyKey: jest.fn(),
}));

import { getEnv } from "../config/env";
import { getSupabaseAdmin } from "../services/supabase";
import { logger } from "../lib/logger";
import { enqueueTask } from "../lib/task-producer";
import { claimIdempotencyKey } from "../lib/idempotency";
import {
  claimNotificationPush,
  deliverPush,
  notifyAndEmail,
} from "../lib/notify";
import { notificationDeliveryTotal } from "../lib/metrics";

type Result = { data: unknown; error: unknown; count?: number };

/** Minimal thenable PostgREST-style builder. */
function chain(result: Result) {
  const builder: Record<string, unknown> = {};
  const self = () => builder;
  for (const method of ["select", "upsert", "insert", "update", "eq", "is", "in", "limit"]) {
    builder[method] = jest.fn(self);
  }
  builder.single = jest.fn(self);
  builder.then = (
    onfulfilled?: (v: Result) => unknown,
    onrejected?: (v: unknown) => unknown,
  ) => Promise.resolve(result).then(onfulfilled, onrejected);
  return builder;
}

function fakeSupabase(options: {
  preferences?: { channel: string; enabled: boolean }[];
  pushCount?: number;
  pushError?: { message: string } | null;
}) {
  const from = jest.fn((table: string) => {
    if (table === "notification_preferences") {
      return chain({ data: options.preferences ?? [], error: null });
    }
    if (table === "push_subscriptions") {
      return chain({
        data: null,
        error: options.pushError ?? null,
        count: options.pushCount ?? 0,
      });
    }
    return chain({ data: [{ id: "notif-1" }], error: null });
  });
  return { from };
}

const baseOpts = {
  userId: "user-1",
  organizationId: "org-1",
  title: "New Comment on Ticket",
  body: "A comment was added.",
  module: "tickets" as const,
  moduleId: "ticket-1",
  action: "comment",
};

const inAppInserted = { inserted: true, deduped: false, suppressed: false };

function setEnv(vapidPublicKey?: string) {
  (getEnv as jest.Mock).mockReturnValue({
    NODE_ENV: "test",
    APP_BASE_URL: "http://localhost:3000",
    LOG_LEVEL: "silent",
    VAPID_PUBLIC_KEY: vapidPublicKey,
  });
}

async function pushMetric(status: string): Promise<number> {
  const metric = await notificationDeliveryTotal.get();
  return (
    metric.values.find((v) => v.labels.channel === "push" && v.labels.status === status)?.value ??
    0
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  setEnv(undefined);
  (enqueueTask as jest.Mock).mockResolvedValue(true);
  (claimIdempotencyKey as jest.Mock).mockResolvedValue(true);
});

describe("claimNotificationPush (NOTIF-P2-001)", () => {
  it("returns true when this call inserted the notification", async () => {
    await expect(claimNotificationPush(inAppInserted, "k1")).resolves.toBe(true);
  });

  it("returns false when the notification was deduped — an earlier call owns the send", async () => {
    await expect(
      claimNotificationPush({ inserted: false, deduped: true, suppressed: false }, "k2"),
    ).resolves.toBe(false);
  });

  it("falls back to the idempotency store when in-app is suppressed", async () => {
    const suppressed = { inserted: false, deduped: false, suppressed: true };
    await expect(claimNotificationPush(suppressed, "k3")).resolves.toBe(true);
    expect(claimIdempotencyKey).toHaveBeenCalledWith("notif-push-k3", "sent");
  });
});

describe("deliverPush (NOTIF-P2-001)", () => {
  it("is a no-op when VAPID is not configured", async () => {
    const supabase = fakeSupabase({ pushCount: 3 });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);

    const skippedBefore = await pushMetric("skipped");
    const result = await deliverPush(
      { userId: "user-1", title: "t", body: "b" },
      inAppInserted,
      "key-vapid-off",
      "tickets",
    );

    expect(result).toEqual({ pushQueued: false, pushSkipped: true });
    expect(supabase.from).not.toHaveBeenCalled();
    expect(enqueueTask).not.toHaveBeenCalled();
    expect(await pushMetric("skipped")).toBe(skippedBefore + 1);
  });

  it("skips the queue when the user has no active subscriptions", async () => {
    setEnv("BPublicKey");
    const supabase = fakeSupabase({ pushCount: 0 });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);

    const result = await deliverPush(
      { userId: "user-1", title: "t", body: "b" },
      inAppInserted,
      "key-no-subs",
      "tickets",
    );

    expect(result).toEqual({ pushQueued: false, pushSkipped: true });
    expect(enqueueTask).not.toHaveBeenCalled();
  });

  it("enqueues notification-push when the user has subscriptions", async () => {
    setEnv("BPublicKey");
    const supabase = fakeSupabase({ pushCount: 2 });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);

    const queuedBefore = await pushMetric("queued");
    const result = await deliverPush(
      { userId: "user-1", title: "Title", body: "Body", url: "http://localhost:3000/portal/tickets/1" },
      inAppInserted,
      "key-with-subs",
      "tickets",
    );

    expect(result).toEqual({ pushQueued: true, pushSkipped: false });
    expect(enqueueTask).toHaveBeenCalledWith(
      "notification-push",
      expect.objectContaining({
        userId: "user-1",
        title: "Title",
        body: "Body",
        url: "http://localhost:3000/portal/tickets/1",
      }),
    );
    expect(await pushMetric("queued")).toBe(queuedBefore + 1);
  });

  it("records a terminal failure when the queue is unavailable", async () => {
    setEnv("BPublicKey");
    const supabase = fakeSupabase({ pushCount: 1 });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
    (enqueueTask as jest.Mock).mockResolvedValue(false);

    const failedBefore = await pushMetric("failed");
    const result = await deliverPush(
      { userId: "user-1", title: "t", body: "b" },
      inAppInserted,
      "key-queue-down",
      "tickets",
    );

    expect(result).toEqual({ pushQueued: false, pushSkipped: false });
    expect(await pushMetric("failed")).toBe(failedBefore + 1);
  });

  it("records a failure when the subscription lookup errors", async () => {
    setEnv("BPublicKey");
    const supabase = fakeSupabase({ pushError: { message: "boom" } });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);

    const result = await deliverPush(
      { userId: "user-1", title: "t", body: "b" },
      inAppInserted,
      "key-db-error",
      "tickets",
    );

    expect(result).toEqual({ pushQueued: false, pushSkipped: false });
    expect(logger.error).toHaveBeenCalled();
  });

  it("does not enqueue a second push when the notification was deduped", async () => {
    setEnv("BPublicKey");
    const supabase = fakeSupabase({ pushCount: 1 });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);

    const result = await deliverPush(
      { userId: "user-1", title: "t", body: "b" },
      { inserted: false, deduped: true, suppressed: false },
      "key-deduped",
      "tickets",
    );

    expect(result).toEqual({ pushQueued: false, pushSkipped: true });
    expect(enqueueTask).not.toHaveBeenCalled();
  });
});

describe("notifyAndEmail push integration (NOTIF-P2-001)", () => {
  it("suppresses push when the recipient disabled the channel", async () => {
    const supabase = fakeSupabase({
      preferences: [{ channel: "push", enabled: false }],
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);

    const result = await notifyAndEmail({ ...baseOpts, email: "user@example.com" });

    expect(result.pushSkipped).toBe(true);
    expect(result.pushQueued).toBe(false);
    expect(enqueueTask).not.toHaveBeenCalledWith("notification-push", expect.anything());
  });

  it("enqueues push alongside email when both are enabled", async () => {
    setEnv("BPublicKey");
    const supabase = fakeSupabase({ pushCount: 1 });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);

    const result = await notifyAndEmail({ ...baseOpts, email: "user@example.com" });

    expect(result.pushQueued).toBe(true);
    expect(enqueueTask).toHaveBeenCalledWith("notification-email", expect.anything());
    expect(enqueueTask).toHaveBeenCalledWith(
      "notification-push",
      expect.objectContaining({
        userId: "user-1",
        url: "http://localhost:3000/portal/tickets/ticket-1",
      }),
    );
  });

  it("reports push as skipped while email still sends when VAPID is off", async () => {
    const supabase = fakeSupabase({ pushCount: 5 });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);

    const result = await notifyAndEmail({ ...baseOpts, email: "user@example.com" });

    expect(result.pushSkipped).toBe(true);
    expect(result.emailQueued).toBe(true);
  });
});
