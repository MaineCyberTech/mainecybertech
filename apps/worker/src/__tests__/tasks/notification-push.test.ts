import { jest } from "@jest/globals";

jest.mock("../../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

jest.mock("../../logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock("../../metrics", () => ({
  recordNotificationDelivery: jest.fn(),
  recordPushSubscriptionRevoked: jest.fn(),
}));

jest.mock("../../push", () => {
  const actual = jest.requireActual("../../push");
  return {
    ...(actual as Record<string, unknown>),
    sendPush: jest.fn(),
    isPushConfigured: jest.fn(() => true),
  };
});

import { getSupabaseAdmin } from "../../services/supabase";
import { recordNotificationDelivery, recordPushSubscriptionRevoked } from "../../metrics";
import { isPushConfigured, sendPush } from "../../push";
import { notificationPush } from "../../tasks/notification-push";

type Result = { data: unknown; error: unknown };

/** Thenable PostgREST-style builder returning one fixed result. */
function chain(result: Result) {
  const builder: Record<string, unknown> = {};
  const self = () => builder;
  builder.select = jest.fn(self);
  builder.update = jest.fn(self);
  builder.eq = jest.fn(self);
  builder.is = jest.fn(self);
  builder.then = (
    onfulfilled?: (v: Result) => unknown,
    onrejected?: (v: unknown) => unknown,
  ) => Promise.resolve(result).then(onfulfilled, onrejected);
  return builder;
}

function mockSupabase(rows: Array<Record<string, unknown>>, error: { message: string } | null = null) {
  const builder = chain({ data: rows, error });
  const from = jest.fn(() => builder);
  (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });
  return { from, builder };
}

const subscription = {
  id: "sub-1",
  endpoint: "https://push.example.com/wpush/v2/abc",
  p256dh: "p256dh",
  auth: "auth",
};

beforeEach(() => {
  jest.clearAllMocks();
  (isPushConfigured as jest.Mock).mockReturnValue(true);
  (sendPush as jest.Mock).mockResolvedValue({ status: "success", statusCode: 201 });
});

describe("notification-push task (NOTIF-P2-001)", () => {
  it("rejects a payload without a recipient or content", async () => {
    const result = await notificationPush({ userId: "user-1" });
    expect(result.ok).toBe(false);
    expect(sendPush).not.toHaveBeenCalled();
  });

  it("is a no-op when VAPID is not configured", async () => {
    (isPushConfigured as jest.Mock).mockReturnValue(false);

    const result = await notificationPush({
      userId: "user-1",
      title: "Title",
      body: "Body",
    });

    expect(result.ok).toBe(true);
    expect(recordNotificationDelivery).toHaveBeenCalledWith("push", "skipped");
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("records a skip when the user has no active subscriptions", async () => {
    mockSupabase([]);

    const result = await notificationPush({
      userId: "user-1",
      title: "Title",
      body: "Body",
    });

    expect(result.ok).toBe(true);
    expect(sendPush).not.toHaveBeenCalled();
    expect(recordNotificationDelivery).toHaveBeenCalledWith("push", "skipped");
  });

  it("sends to every active subscription and stamps last_seen_at", async () => {
    const { builder } = mockSupabase([subscription]);

    const result = await notificationPush({
      userId: "user-1",
      title: "Ticket assigned",
      body: "You were assigned ticket #1",
      url: "https://app.example.com/portal/tickets/1",
    });

    expect(result.ok).toBe(true);
    expect(sendPush).toHaveBeenCalledTimes(1);
    expect(sendPush).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: subscription.endpoint }),
      expect.objectContaining({ title: "Ticket assigned" }),
    );
    expect(recordNotificationDelivery).toHaveBeenCalledWith("push", "success");
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ last_seen_at: expect.any(String) }),
    );
  });

  it("revokes a subscription the push service reports as gone (410)", async () => {
    (sendPush as jest.Mock).mockResolvedValue({ status: "revoked", statusCode: 410 });
    const { builder } = mockSupabase([subscription]);

    const result = await notificationPush({
      userId: "user-1",
      title: "Title",
      body: "Body",
    });

    expect(result.ok).toBe(true);
    expect(recordPushSubscriptionRevoked).toHaveBeenCalledTimes(1);
    expect(recordNotificationDelivery).toHaveBeenCalledWith("push", "skipped");
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ revoked_at: expect.any(String) }),
    );
  });

  it("returns ok:false so the queue retries when every send fails", async () => {
    (sendPush as jest.Mock).mockResolvedValue({ status: "failed", statusCode: 503 });
    mockSupabase([subscription]);

    const result = await notificationPush({
      userId: "user-1",
      title: "Title",
      body: "Body",
    });

    expect(result.ok).toBe(false);
    expect(recordNotificationDelivery).toHaveBeenCalledWith("push", "failed");
  });

  it("does not fail the task on a partial failure (avoids duplicate re-sends)", async () => {
    (sendPush as jest.Mock)
      .mockResolvedValueOnce({ status: "success", statusCode: 201 })
      .mockResolvedValueOnce({ status: "failed", statusCode: 500 });
    mockSupabase([subscription, { ...subscription, id: "sub-2" }]);

    const result = await notificationPush({
      userId: "user-1",
      title: "Title",
      body: "Body",
    });

    expect(result.ok).toBe(true);
    expect(sendPush).toHaveBeenCalledTimes(2);
    expect(recordNotificationDelivery).toHaveBeenCalledWith("push", "success");
    expect(recordNotificationDelivery).toHaveBeenCalledWith("push", "failed");
  });

  it("fails the task when the subscription lookup errors", async () => {
    mockSupabase([], { message: "db down" });

    const result = await notificationPush({
      userId: "user-1",
      title: "Title",
      body: "Body",
    });

    expect(result.ok).toBe(false);
    expect(sendPush).not.toHaveBeenCalled();
  });
});
