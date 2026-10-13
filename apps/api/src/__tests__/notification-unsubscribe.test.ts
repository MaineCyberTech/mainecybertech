import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder } from "./helpers";
import { errorHandler } from "../middleware/error";
import { buildUnsubscribeToken } from "../lib/unsubscribe-token";

const SERVICE_ROLE_KEY = "test-service-role-key-that-is-long-enough";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    APP_BASE_URL: "http://localhost:3000",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key-that-is-long-enough",
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

jest.mock("../lib/logger", () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { getSupabaseAdmin } from "../services/supabase";
import unsubscribeRouter from "../routes/notification-unsubscribe";

const app = createTestApp();
app.use("/api/v1/notifications/unsubscribe", unsubscribeRouter);
app.use(errorHandler);

function mockUpsert(result: { error: unknown } = { error: null }) {
  const builder = createMockBuilder({ data: null, error: result.error });
  const supabase = { from: jest.fn().mockReturnValue(builder) };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return { supabase, builder };
}

describe("GET /api/v1/notifications/unsubscribe (NOTIF-P3-005)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("records a global email opt-out for a valid signed token", async () => {
    const { supabase, builder } = mockUpsert();
    const token = buildUnsubscribeToken(
      { userId: "user-1", organizationId: "org-1" },
      SERVICE_ROLE_KEY,
    );

    const res = await request(app).get(
      `/api/v1/notifications/unsubscribe?token=${encodeURIComponent(token)}`,
    );

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("unsubscribed");
    expect(supabase.from).toHaveBeenCalledWith("notification_preferences");
    const row = builder.upsert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(row).toMatchObject({
      organization_id: "org-1",
      user_id: "user-1",
      module_key: "all",
      channel: "email",
      enabled: false,
    });
  });

  it("rejects a tampered token without writing anything", async () => {
    const { supabase } = mockUpsert();
    const token = buildUnsubscribeToken(
      { userId: "user-1", organizationId: "org-1" },
      SERVICE_ROLE_KEY,
    );
    const tampered = `${token.split(".")[0]}.deadbeef`;

    const res = await request(app).get(
      `/api/v1/notifications/unsubscribe?token=${encodeURIComponent(tampered)}`,
    );

    expect(res.status).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("rejects a token signed with a different key", async () => {
    const { supabase } = mockUpsert();
    const foreign = buildUnsubscribeToken(
      { userId: "user-1", organizationId: "org-1" },
      "some-other-service-role-key-long-enough",
    );

    const res = await request(app).get(
      `/api/v1/notifications/unsubscribe?token=${encodeURIComponent(foreign)}`,
    );

    expect(res.status).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("rejects a missing token", async () => {
    const res = await request(app).get("/api/v1/notifications/unsubscribe");
    expect(res.status).toBe(400);
  });

  it("fails closed with 500 when the preference write fails", async () => {
    mockUpsert({ error: { message: "db down" } });
    const token = buildUnsubscribeToken(
      { userId: "user-1", organizationId: "org-1" },
      SERVICE_ROLE_KEY,
    );

    const res = await request(app).get(
      `/api/v1/notifications/unsubscribe?token=${encodeURIComponent(token)}`,
    );

    expect(res.status).toBe(500);
  });
});
