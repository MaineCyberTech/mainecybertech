import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder, createOrgAccessStub, type MockResult, tableAwareFrom } from "./helpers";
import webhookManagementRouter from "../routes/webhook-management";
import { errorHandler } from "../middleware/error";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test", SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key", SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*", LOG_LEVEL: "silent", API_PORT: 4000,
    FIELD_ENCRYPTION_KEY: "a".repeat(64),
  }),
}));

jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn(),
    getScopedClient: jest.fn((_req, _moduleKey, _kind) => require("../services/supabase").getSupabaseAdmin()) }));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

jest.mock("../middleware/org-access", () =>
  createOrgAccessStub("00000000-0000-0000-0000-000000000001"),
);
jest.mock("../middleware/permissions", () => ({
  requirePermission:
    () =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
}));

jest.mock("../lib/idempotency", () => ({
  claimIdempotencyKey: jest.fn().mockResolvedValue(true),
  deleteIdempotencyKey: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../lib/pinned-fetch", () => ({ pinnedFetch: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";
import { encryptField } from "../lib/field-encryption";

function mockAuth() {
  const supabase: any = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1", email: "admin@test.com" } }, error: null });
  return supabase;
}

const app = createTestApp();
app.use("/api/v1/webhook-endpoints", webhookManagementRouter);
app.use(errorHandler);

describe("webhook-management routes", () => {
  let supabase: any;

  beforeEach(() => { supabase = mockAuth(); jest.clearAllMocks(); });

  it("GET / lists webhook endpoints", async () => {
    supabase.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: [{ id: "wh1", name: "Test" }], error: null } as MockResult)));
    const res = await request(app).get("/api/v1/webhook-endpoints").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("GET / masks secret in response", async () => {
    supabase.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: { id: "wh1", name: "Test", secret: "my-super-secret-key-12345", organization_id: "00000000-0000-0000-0000-000000000001" }, error: null } as MockResult)));
    const res = await request(app).get("/api/v1/webhook-endpoints/wh1").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.data.secret).toBe("my-s****2345");
    expect(res.body.data.secret).not.toContain("super-secret-key");
  });

  it("GET /:id returns single endpoint", async () => {
    supabase.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: { id: "wh1", name: "Test", organization_id: "00000000-0000-0000-0000-000000000001" }, error: null } as MockResult)));
    const res = await request(app).get("/api/v1/webhook-endpoints/wh1").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("GET /:id/deliveries returns delivery log", async () => {
    supabase.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null, count: 0 } as MockResult)));
    const res = await request(app).get("/api/v1/webhook-endpoints/wh1/deliveries").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("GET / returns 401 without auth", async () => {
    const res = await request(app).get("/api/v1/webhook-endpoints");
    expect(res.status).toBe(401);
  });

  it("POST / rejects webhook URLs pointing at private/loopback hosts (SSRF)", async () => {
    // requireAdmin: memberships lookup returns an admin membership
    const adminSupabase = mockAuth();
    adminSupabase.from.mockReturnValue(
      createMockBuilder({
        data: [{ id: "m1", roles: { id: "r1", key: "admin" } }],
        error: null,
      } as MockResult),
    );

    const res = await request(app)
      .post("/api/v1/webhook-endpoints")
      .set("Authorization", "Bearer token")
      .send({
        organizationId: "00000000-0000-0000-0000-000000000001",
        name: "Internal hook",
        url: "http://169.254.169.254/latest/meta-data",
        events: ["ticket.created"],
      });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe("VALIDATION");
    expect(adminSupabase.from).not.toHaveBeenCalledWith("webhook_endpoints");
  });

  it("POST / rejects non-http(s) webhook schemes", async () => {
    const adminSupabase = mockAuth();
    adminSupabase.from.mockReturnValue(
      createMockBuilder({
        data: [{ id: "m1", roles: { id: "r1", key: "admin" } }],
        error: null,
      } as MockResult),
    );

    const res = await request(app)
      .post("/api/v1/webhook-endpoints")
      .set("Authorization", "Bearer token")
      .send({
        organizationId: "00000000-0000-0000-0000-000000000001",
        name: "Redis hook",
        url: "redis://127.0.0.1:6379",
        events: ["ticket.created"],
      });

    expect(res.status).toBe(400);
  });

  it("POST / rejects uncatalogued event types (EVOL-P2-002)", async () => {
    const adminSupabase = mockAuth();
    adminSupabase.from.mockReturnValue(
      createMockBuilder({
        data: [{ id: "m1", roles: { id: "r1", key: "admin" } }],
        error: null,
      } as MockResult),
    );

    const res = await request(app)
      .post("/api/v1/webhook-endpoints")
      .set("Authorization", "Bearer token")
      .send({
        organizationId: "00000000-0000-0000-0000-000000000001",
        name: "Unknown event hook",
        url: "https://example.com/hook",
        events: ["ticket.exploded"],
      });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe("VALIDATION");
    expect(adminSupabase.from).not.toHaveBeenCalledWith("webhook_endpoints");
  });

  it("POST /:id/test rejects internal webhook URLs with 400 (SSRF guard) instead of fetching", async () => {
    const adminSupabase = mockAuth();
    adminSupabase.from.mockImplementation((table: string) => {
      if (table === "webhook_endpoints") {
        return createMockBuilder({
          data: {
            id: "wh1",
            organization_id: "00000000-0000-0000-0000-000000000001",
            url: "http://169.254.169.254/latest/meta-data",
            secret: null,
          },
          error: null,
        } as MockResult);
      }
      if (table === "profiles") {
        return createMockBuilder({ data: [{ is_super_admin: true }], error: null });
      }
      if (table === "memberships") {
        return createMockBuilder({
          data: [{ id: "m1", roles: { id: "r1", key: "super_admin" } }],
          error: null,
        } as MockResult);
      }
      if (table === "subscriptions") {
        return createMockBuilder({
          data: [
            {
              id: "s1",
              organization_id: "00000000-0000-0000-0000-000000000001",
              status: "active",
              plan: "pro",
              current_period_end: "2027-12-31T23:59:59Z",
            },
          ],
          error: null,
        } as MockResult);
      }
      if (table === "permissions") {
        return createMockBuilder({ data: [], error: null });
      }
      return createMockBuilder({ data: [], error: null });
    });

    const res = await request(app)
      .post("/api/v1/webhook-endpoints/wh1/test")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe("VALIDATION");
  });

  describe("signing secret encryption and rotation metadata [WH-P2-008]", () => {
    const ORG = "00000000-0000-0000-0000-000000000001";

    it("encrypts the signing secret and records rotation metadata on create", async () => {
      const builder = createMockBuilder({
        data: { id: "wh-new", name: "New", organization_id: ORG, url: "https://93.184.216.34/hook" },
        error: null,
      } as MockResult);
      supabase.from.mockImplementation(tableAwareFrom(builder));

      const res = await request(app)
        .post("/api/v1/webhook-endpoints")
        .set("Authorization", "Bearer token")
        .send({
          organizationId: ORG,
          name: "New",
          url: "https://93.184.216.34/hook",
          secret: "super-secret-value-12345",
          events: ["ticket.created"],
        });

      expect(res.status).toBe(201);
      const inserted = builder.insert.mock.calls[0][0] as Record<string, unknown>;
      expect(inserted.secret).toMatch(/^v1:/);
      expect(inserted.secret).not.toContain("super-secret-value-12345");
      expect(inserted.secret_rotated_at).toEqual(expect.any(String));
      expect(inserted.secret_expires_at).toEqual(expect.any(String));
    });

    it("masks the decrypted secret on read (encrypted at rest)", async () => {
      const stored = encryptField("my-super-secret-key-12345");
      expect(stored).toMatch(/^v1:/);
      supabase.from.mockImplementation(
        tableAwareFrom(
          createMockBuilder({
            data: { id: "wh1", name: "Test", secret: stored, organization_id: ORG },
            error: null,
          } as MockResult),
        ),
      );

      const res = await request(app)
        .get("/api/v1/webhook-endpoints/wh1")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      expect(res.body.data.secret).toBe("my-s****2345");
    });

    it("keeps reading legacy plaintext secrets (backward compatible)", async () => {
      supabase.from.mockImplementation(
        tableAwareFrom(
          createMockBuilder({
            data: {
              id: "wh1",
              name: "Test",
              secret: "legacy-plaintext-secret-123",
              organization_id: ORG,
            },
            error: null,
          } as MockResult),
        ),
      );

      const res = await request(app)
        .get("/api/v1/webhook-endpoints/wh1")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      expect(res.body.data.secret).toBe("lega****-123");
    });

    it("returns null (not 500) when a stored secret cannot be decrypted", async () => {
      supabase.from.mockImplementation(
        tableAwareFrom(
          createMockBuilder({
            data: { id: "wh1", name: "Test", secret: "v1:AAAA:BBBB:CCCC", organization_id: ORG },
            error: null,
          } as MockResult),
        ),
      );

      const res = await request(app)
        .get("/api/v1/webhook-endpoints/wh1")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      expect(res.body.data.secret).toBeNull();
    });

    it("re-encrypts and resets rotation metadata when the secret changes", async () => {
      const builder = createMockBuilder({
        data: { id: "wh1", name: "Test", organization_id: ORG, version: 1, url: "https://example.com/hook" },
        error: null,
      } as MockResult);
      supabase.from.mockImplementation(tableAwareFrom(builder));

      const res = await request(app)
        .patch("/api/v1/webhook-endpoints/wh1")
        .set("Authorization", "Bearer token")
        .send({ secret: "new-secret-value-9999" });

      expect(res.status).toBe(200);
      const updateArgs = builder.update.mock.calls[0][0] as Record<string, unknown>;
      expect(updateArgs.secret).toMatch(/^v1:/);
      expect(updateArgs.secret_rotated_at).toEqual(expect.any(String));
      expect(updateArgs.secret_expires_at).toEqual(expect.any(String));
    });
  });

  describe("test ping idempotency [WH-P3-001]", () => {
    const ORG = "00000000-0000-0000-0000-000000000001";

    function mockTestWebhook() {
      const s = mockAuth();
      const endpointsBuilder = createMockBuilder({
        data: {
          id: "wh1",
          organization_id: ORG,
          url: "https://93.184.216.34/hook",
          secret: null,
        },
        error: null,
      } as MockResult);
      const deliveriesBuilder = createMockBuilder({ data: null, error: null } as MockResult);
      s.from.mockImplementation((table: string) => {
        if (table === "webhook_endpoints") return endpointsBuilder;
        if (table === "webhook_deliveries") return deliveriesBuilder;
        return createMockBuilder({ data: null, error: null } as MockResult);
      });
      return { deliveriesBuilder };
    }

    it("derives a deterministic key from the endpoint and payload", async () => {
      const { buildTestIdempotencyKey } = await import("../routes/webhook-management");
      const payload = {
        event: "ping",
        timestamp: "2026-01-01T00:00:00.000Z",
        data: { message: "Test from Maine CyberTech" },
      };
      const key = buildTestIdempotencyKey("wh1", payload);
      expect(key).toMatch(/^test-wh1-[0-9a-f]{16}$/);
      expect(buildTestIdempotencyKey("wh1", payload)).toBe(key);
      expect(buildTestIdempotencyKey("wh2", payload)).not.toBe(key);
      expect(
        buildTestIdempotencyKey("wh1", { ...payload, timestamp: "2026-01-01T00:00:01.000Z" }),
      ).not.toBe(key);
    });

    it("claims the key before sending and records the delivery via upsert", async () => {
      const { deliveriesBuilder } = mockTestWebhook();
      const { claimIdempotencyKey } = await import("../lib/idempotency");
      const { pinnedFetch } = await import("../lib/pinned-fetch");
      (claimIdempotencyKey as jest.Mock).mockClear().mockResolvedValue(true);
      (pinnedFetch as jest.Mock).mockReset().mockResolvedValue({
        status: 200,
        text: jest.fn().mockResolvedValue("ok"),
      });

      const res = await request(app)
        .post("/api/v1/webhook-endpoints/wh1/test")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      const key = (claimIdempotencyKey as jest.Mock).mock.calls[0][0] as string;
      expect(key).toMatch(/^test-wh1-[0-9a-f]{16}$/);
      expect((claimIdempotencyKey as jest.Mock).mock.calls[0][1]).toBe("processing");
      expect(deliveriesBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ idempotency_key: key }),
        { onConflict: "idempotency_key" },
      );
    });

    it("deduplicates an exact replay instead of sending twice", async () => {
      mockTestWebhook();
      const { claimIdempotencyKey } = await import("../lib/idempotency");
      const { pinnedFetch } = await import("../lib/pinned-fetch");
      (claimIdempotencyKey as jest.Mock).mockClear().mockResolvedValueOnce(false);
      (pinnedFetch as jest.Mock).mockReset();

      const res = await request(app)
        .post("/api/v1/webhook-endpoints/wh1/test")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      expect(res.body.data.deduplicated).toBe(true);
      expect(pinnedFetch).not.toHaveBeenCalled();
    });
  });

  describe("by-id tenant scoping", () => {
    const ORG = "00000000-0000-0000-0000-000000000001";
    const OTHER = "00000000-0000-0000-0000-000000000002";

    function mockWebhook(orgId: string) {
      const s = mockAuth();
      s.from.mockReturnValue(
        createMockBuilder({
          data: {
            id: "wh1",
            name: "Test",
            organization_id: orgId,
            version: 1,
            url: "https://example.com/hook",
          },
          error: null,
        } as MockResult),
      );
      return s;
    }

    it("GET /:id returns 404 when the webhook is in another org", async () => {
      mockWebhook(OTHER);
      const res = await request(app)
        .get("/api/v1/webhook-endpoints/wh1")
        .set("Authorization", "Bearer token");
      expect(res.status).toBe(404);
    });

    it("PATCH /:id returns 404 when the webhook is in another org", async () => {
      mockWebhook(OTHER);
      const res = await request(app)
        .patch("/api/v1/webhook-endpoints/wh1")
        .set("Authorization", "Bearer token")
        .send({ name: "renamed" });
      expect(res.status).toBe(404);
    });

    it("DELETE /:id returns 404 when the webhook is in another org", async () => {
      mockWebhook(OTHER);
      const res = await request(app)
        .delete("/api/v1/webhook-endpoints/wh1")
        .set("Authorization", "Bearer token")
        .send({ confirm: true });
      expect(res.status).toBe(404);
    });

    it("POST /:id/test returns 404 when the webhook is in another org", async () => {
      mockWebhook(OTHER);
      const res = await request(app)
        .post("/api/v1/webhook-endpoints/wh1/test")
        .set("Authorization", "Bearer token");
      expect(res.status).toBe(404);
    });

    it("PATCH /:id succeeds when the webhook belongs to the caller's org", async () => {
      mockWebhook(ORG);
      const res = await request(app)
        .patch("/api/v1/webhook-endpoints/wh1")
        .set("Authorization", "Bearer token")
        .send({ name: "renamed" });
      expect(res.status).toBe(200);
    });

    it("DELETE /:id succeeds when the webhook belongs to the caller's org", async () => {
      mockWebhook(ORG);
      const res = await request(app)
        .delete("/api/v1/webhook-endpoints/wh1")
        .set("Authorization", "Bearer token")
        .send({ confirm: true });
      expect(res.status).toBe(204);
    });

    it("DELETE /:id requires confirmation", async () => {
      const res = await request(app)
        .delete("/api/v1/webhook-endpoints/wh1")
        .set("Authorization", "Bearer token");
      expect(res.status).toBe(400);
    });
  });
});
