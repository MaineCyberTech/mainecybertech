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

const BASE = "/api/v1/notifications/unsubscribe";

function mockUpsert(result: { error: unknown } = { error: null }) {
  const builder = createMockBuilder({ data: null, error: result.error });
  const supabase = { from: jest.fn().mockReturnValue(builder) };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return { supabase, builder };
}

function validToken() {
  return buildUnsubscribeToken({ userId: "user-1", organizationId: "org-1" }, SERVICE_ROLE_KEY);
}

describe("notification unsubscribe (NOTIF-P3-005 / NOTIF-P2-012)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GET renders a confirmation page and performs no write", async () => {
    const { supabase } = mockUpsert();
    const token = validToken();

    const res = await request(app).get(`${BASE}?token=${encodeURIComponent(token)}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("Unsubscribe from notification emails");
    expect(res.text).toContain("<form method=\"post\"");
    // NOTIF-P2-012: prefetching scanners must not opt the recipient out.
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("POST records a global email opt-out for a valid signed token", async () => {
    const { supabase, builder } = mockUpsert();
    const token = validToken();

    const res = await request(app).post(`${BASE}?token=${encodeURIComponent(token)}`);

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

  it("POST accepts the RFC 8058 one-click body with the token in the query", async () => {
    const { builder } = mockUpsert();
    const token = validToken();

    const res = await request(app)
      .post(`${BASE}?token=${encodeURIComponent(token)}`)
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send("List-Unsubscribe=One-Click");

    expect(res.status).toBe(200);
    expect(builder.upsert).toHaveBeenCalled();
  });

  it("GET rejects a tampered token without writing anything", async () => {
    const { supabase } = mockUpsert();
    const tampered = `${validToken().split(".")[0]}.deadbeef`;

    const res = await request(app).get(`${BASE}?token=${encodeURIComponent(tampered)}`);

    expect(res.status).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("POST rejects a token signed with a different key", async () => {
    const { supabase } = mockUpsert();
    const foreign = buildUnsubscribeToken(
      { userId: "user-1", organizationId: "org-1" },
      "some-other-service-role-key-long-enough",
    );

    const res = await request(app).post(`${BASE}?token=${encodeURIComponent(foreign)}`);

    expect(res.status).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("rejects an expired token on both GET and POST", async () => {
    const { supabase } = mockUpsert();
    const expired = buildUnsubscribeToken(
      { userId: "user-1", organizationId: "org-1" },
      SERVICE_ROLE_KEY,
      { ttlSeconds: 0 },
    );

    const getRes = await request(app).get(`${BASE}?token=${encodeURIComponent(expired)}`);
    const postRes = await request(app).post(`${BASE}?token=${encodeURIComponent(expired)}`);

    expect(getRes.status).toBe(400);
    expect(postRes.status).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("rejects a missing token", async () => {
    const getRes = await request(app).get(BASE);
    const postRes = await request(app).post(BASE);
    expect(getRes.status).toBe(400);
    expect(postRes.status).toBe(400);
  });

  it("fails closed with 500 when the preference write fails", async () => {
    mockUpsert({ error: { message: "db down" } });
    const token = validToken();

    const res = await request(app).post(`${BASE}?token=${encodeURIComponent(token)}`);

    expect(res.status).toBe(500);
  });
});
