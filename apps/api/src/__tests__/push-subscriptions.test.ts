import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder, createOrgAccessStub } from "./helpers";
import { errorHandler } from "../middleware/error";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    APP_BASE_URL: "http://localhost:3000",
    VAPID_PUBLIC_KEY: undefined,
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

const mockRequireOrgAccess = jest.fn();

jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (req: unknown, res: unknown, next: () => void) =>
    mockRequireOrgAccess(req, res, next),
  requireOrgAccessByParam: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { getEnv } from "../config/env";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import pushSubscriptionsRouter from "../routes/push-subscriptions";

const authToken = "Bearer test-token";
const testOrgId = "00000000-0000-0000-0000-000000000001";
const endpoint = "https://push.example.com/wpush/v2/abc123";
const keys = { p256dh: "p256dh-key", auth: "auth-secret" };

function mockAuth() {
  const supabase = {
    from: jest.fn(),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return supabase;
}

const app = createTestApp();
app.use("/api/v1/push-subscriptions", pushSubscriptionsRouter);
app.use(errorHandler);

describe("Push Subscriptions API (NOTIF-P2-001)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireOrgAccess.mockImplementation(createOrgAccessStub(testOrgId).requireOrgAccess);
    (getEnv as jest.Mock).mockReturnValue({
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      APP_BASE_URL: "http://localhost:3000",
      VAPID_PUBLIC_KEY: undefined,
    });
  });

  it("reports the channel disabled when VAPID is not configured", async () => {
    mockAuth();
    const res = await request(app)
      .get("/api/v1/push-subscriptions/vapid-public-key")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ enabled: false, publicKey: null });
  });

  it("returns the VAPID public key when configured", async () => {
    mockAuth();
    (getEnv as jest.Mock).mockReturnValue({
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      APP_BASE_URL: "http://localhost:3000",
      VAPID_PUBLIC_KEY: "BPublicKeyBase64Url",
    });
    const res = await request(app)
      .get("/api/v1/push-subscriptions/vapid-public-key")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ enabled: true, publicKey: "BPublicKeyBase64Url" });
  });

  it("registers a subscription with the resolved org and owner", async () => {
    const supabase = mockAuth();
    const builder = createMockBuilder({
      data: { id: "sub-1", endpoint },
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const res = await request(app)
      .post("/api/v1/push-subscriptions")
      .set("Authorization", authToken)
      .set("User-Agent", "test-agent")
      .send({ endpoint, keys });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ id: "sub-1", endpoint });
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        organization_id: testOrgId,
        endpoint,
        p256dh: "p256dh-key",
        auth: "auth-secret",
        revoked_at: null,
        user_agent: "test-agent",
      }),
      { onConflict: "endpoint" },
    );
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "push_subscription.subscribe" }),
    );
  });

  it("rejects a non-https endpoint", async () => {
    mockAuth();
    const res = await request(app)
      .post("/api/v1/push-subscriptions")
      .set("Authorization", authToken)
      .send({ endpoint: "http://internal.example.com/push", keys });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid endpoint URL", async () => {
    mockAuth();
    const res = await request(app)
      .post("/api/v1/push-subscriptions")
      .set("Authorization", authToken)
      .send({ endpoint: "not-a-url", keys });
    expect(res.status).toBe(400);
  });

  it("rejects a payload without subscription keys", async () => {
    mockAuth();
    const res = await request(app)
      .post("/api/v1/push-subscriptions")
      .set("Authorization", authToken)
      .send({ endpoint });
    expect(res.status).toBe(400);
  });

  it("revokes only the caller's subscription for the endpoint", async () => {
    const supabase = mockAuth();
    const builder = createMockBuilder({ data: [{ id: "sub-1" }], error: null });
    supabase.from.mockReturnValue(builder);

    const res = await request(app)
      .delete("/api/v1/push-subscriptions")
      .set("Authorization", authToken)
      .send({ endpoint });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ revoked: 1 });
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ revoked_at: expect.any(String) }),
    );
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(builder.eq).toHaveBeenCalledWith("endpoint", endpoint);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "push_subscription.unsubscribe" }),
    );
  });

  it("rejects an unsubscribe without an endpoint", async () => {
    mockAuth();
    const res = await request(app)
      .delete("/api/v1/push-subscriptions")
      .set("Authorization", authToken)
      .send({});
    expect(res.status).toBe(400);
  });
});
