import { jest } from "@jest/globals";
import request from "supertest";
import notificationsRouter, {
  SSE_MAX_STREAMS,
  acquireSseSlot,
  sseActiveStreams,
  resetSseStreams,
  subscribeToUserNotifications,
  sharedNotificationChannelCount,
  resetSharedNotificationChannels,
} from "../routes/notifications";
import { createTestApp, createMockBuilder, type MockResult, tableAwareFrom } from "./helpers";
import { errorHandler } from "../middleware/error";

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

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));

jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";

function mockAuth() {
  const supabase: any = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "user@test.com" } },
    error: null,
  });
  return supabase;
}

const app = createTestApp();
app.use("/api/v1/notifications", notificationsRouter);
app.use(errorHandler);

describe("SSE stream cap and shared channels [PERF-P2-005]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSseStreams();
    resetSharedNotificationChannels();
  });

  afterEach(() => {
    resetSseStreams();
    resetSharedNotificationChannels();
  });

  it("rejects new streams with 503 + Retry-After once the cap is reached", async () => {
    const supabase = mockAuth();
    supabase.from.mockImplementation(
      tableAwareFrom(createMockBuilder({ data: null, error: null } as MockResult)),
    );

    for (let i = 0; i < SSE_MAX_STREAMS; i += 1) {
      expect(acquireSseSlot()).toBe(true);
    }

    const res = await request(app)
      .get("/api/v1/notifications/stream")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(503);
    expect(res.headers["retry-after"]).toBe("10");
    expect(res.body.error?.code).toBe("SERVICE_UNAVAILABLE");
    // The rejected request must not consume a slot.
    expect(sseActiveStreams()).toBe(SSE_MAX_STREAMS);
  });

  it("shares one Supabase channel across streams for the same user", () => {
    const channel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    };
    const client = {
      channel: jest.fn(() => channel),
      removeChannel: jest.fn(),
    };

    const first = jest.fn();
    const second = jest.fn();

    const unsubscribeFirst = subscribeToUserNotifications(client as never, "user-1", first);
    const unsubscribeSecond = subscribeToUserNotifications(client as never, "user-1", second);

    expect(client.channel).toHaveBeenCalledTimes(1);
    expect(sharedNotificationChannelCount()).toBe(1);

    // The channel survives while any stream for the user is open.
    unsubscribeFirst();
    expect(client.removeChannel).not.toHaveBeenCalled();
    expect(sharedNotificationChannelCount()).toBe(1);

    unsubscribeSecond();
    expect(client.removeChannel).toHaveBeenCalledTimes(1);
    expect(sharedNotificationChannelCount()).toBe(0);
  });

  it("fans INSERT payloads out to every subscriber of the shared channel", () => {
    const channel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    };
    const client = {
      channel: jest.fn(() => channel),
      removeChannel: jest.fn(),
    };

    const first = jest.fn();
    const second = jest.fn();
    subscribeToUserNotifications(client as never, "user-2", first);
    subscribeToUserNotifications(client as never, "user-2", second);

    const insertCall = channel.on.mock.calls.find(
      ([type, config]: [string, { event?: string }]) =>
        type === "postgres_changes" && config.event === "INSERT",
    );
    const insertHandler = insertCall?.[2] as (payload: { new: Record<string, unknown> }) => void;
    insertHandler({ new: { user_id: "user-2", title: "hi" } });

    expect(first).toHaveBeenCalledWith("notification", { user_id: "user-2", title: "hi" });
    expect(second).toHaveBeenCalledWith("notification", { user_id: "user-2", title: "hi" });
  });
});
