import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder, createOrgAccessStub, type MockResult } from "./helpers";
import webhookManagementRouter from "../routes/webhook-management";
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
  getScopedClient: jest.fn((_req: unknown, _moduleKey: unknown, _kind: unknown) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));
jest.mock("../lib/task-producer", () => ({
  enqueueTask: jest.fn().mockResolvedValue(true),
}));

const ORG = "00000000-0000-0000-0000-000000000001";
const OTHER = "00000000-0000-0000-0000-000000000002";

jest.mock("../middleware/org-access", () =>
  createOrgAccessStub("00000000-0000-0000-0000-000000000001"),
);
jest.mock("../middleware/permissions", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { enqueueTask } from "../lib/task-producer";

function mockAuth() {
  const supabase: any = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "admin-1", email: "admin@test.com" } },
    error: null,
  });
  return supabase;
}

const app = createTestApp();
app.use("/api/v1/webhook-endpoints", webhookManagementRouter);
app.use(errorHandler);

const deadLetterRow = {
  id: "dl1",
  webhook_id: "wh1",
  event: "ticket.created",
  request_body: { event: "ticket.created", data: { ticketId: "t1" } },
  attempt_count: 5,
  last_attempt_at: "2026-09-01T10:00:00.000Z",
  last_error: "HTTP 500 after 5 attempts",
  created_at: "2026-09-01T09:00:00.000Z",
};

const endpointRow = {
  id: "wh1",
  name: "Ops Hook",
  url: "https://example.com/hook",
};

describe("webhook dead-letter routes", () => {
  let supabase: any;
  let deadLetterBuilder: ReturnType<typeof createMockBuilder>;
  let endpointBuilder: ReturnType<typeof createMockBuilder>;
  let deliveryBuilder: ReturnType<typeof createMockBuilder>;

  beforeEach(() => {
    supabase = mockAuth();
    jest.clearAllMocks();
    deadLetterBuilder = createMockBuilder({ data: deadLetterRow, error: null } as MockResult);
    endpointBuilder = createMockBuilder({
      data: { ...endpointRow, organization_id: ORG },
      error: null,
    } as MockResult);
    deliveryBuilder = createMockBuilder({ data: null, error: null } as MockResult);
    supabase.from.mockImplementation((table: string) => {
      if (table === "webhook_dead_letters") return deadLetterBuilder;
      if (table === "webhook_endpoints") return endpointBuilder;
      return deliveryBuilder;
    });
  });

  describe("GET /dead-letters", () => {
    beforeEach(() => {
      deadLetterBuilder = createMockBuilder({
        data: [deadLetterRow],
        error: null,
        count: 1,
      } as MockResult);
      endpointBuilder = createMockBuilder({
        data: [endpointRow],
        error: null,
      } as MockResult);
      supabase.from.mockImplementation((table: string) => {
        if (table === "webhook_dead_letters") return deadLetterBuilder;
        if (table === "webhook_endpoints") return endpointBuilder;
        return deliveryBuilder;
      });
    });

    it("returns the paginated envelope joined with endpoint name/url", async () => {
      const res = await request(app)
        .get("/api/v1/webhook-endpoints/dead-letters")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(25);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0]).toMatchObject({
        id: "dl1",
        event: "ticket.created",
        attempt_count: 5,
        last_error: "HTTP 500 after 5 attempts",
        endpoint: { id: "wh1", name: "Ops Hook", url: "https://example.com/hook" },
      });
      expect(deadLetterBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(deadLetterBuilder.range).toHaveBeenCalledWith(0, 24);
    });

    it("translates page/limit into a range and caps limit at 50", async () => {
      await request(app)
        .get("/api/v1/webhook-endpoints/dead-letters?page=3&limit=100")
        .set("Authorization", "Bearer token");

      expect(deadLetterBuilder.range).toHaveBeenCalledWith(100, 149);
    });

    it("applies the event and webhookId filters", async () => {
      await request(app)
        .get("/api/v1/webhook-endpoints/dead-letters?event=ticket.created&webhookId=wh1")
        .set("Authorization", "Bearer token");

      expect(deadLetterBuilder.eq).toHaveBeenCalledWith("event", "ticket.created");
      expect(deadLetterBuilder.eq).toHaveBeenCalledWith("webhook_id", "wh1");
    });

    it("scopes the list to the caller's organization endpoints", async () => {
      await request(app)
        .get("/api/v1/webhook-endpoints/dead-letters")
        .set("Authorization", "Bearer token");

      expect(endpointBuilder.eq).toHaveBeenCalledWith("organization_id", ORG);
    });

    it("returns an empty envelope without querying dead letters when the org has no endpoints", async () => {
      endpointBuilder = createMockBuilder({ data: [], error: null } as MockResult);
      supabase.from.mockImplementation((table: string) => {
        if (table === "webhook_dead_letters") return deadLetterBuilder;
        if (table === "webhook_endpoints") return endpointBuilder;
        return deliveryBuilder;
      });

      const res = await request(app)
        .get("/api/v1/webhook-endpoints/dead-letters")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ items: [], total: 0, page: 1, limit: 25 });
      expect(deadLetterBuilder.select).not.toHaveBeenCalled();
    });

    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/v1/webhook-endpoints/dead-letters");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /dead-letters/:id/retry", () => {
    it("re-queues the delivery, removes the dead letter and audits the retry", async () => {
      const res = await request(app)
        .post("/api/v1/webhook-endpoints/dead-letters/dl1/retry")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ ok: true });

      expect(deliveryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          webhook_id: "wh1",
          event: "ticket.created",
          status: "failed",
          dead_letter: false,
          retry_count: 0,
        }),
      );
      expect(enqueueTask).toHaveBeenCalledWith("webhook-retry", {});
      expect(deadLetterBuilder.delete).toHaveBeenCalled();
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG,
          action: "webhook.dead_letter.retried",
          entityType: "webhook_dead_letter",
          entityId: "dl1",
        }),
      );
    });

    it("returns 404 (and does not retry) when the endpoint is in another org", async () => {
      endpointBuilder = createMockBuilder({
        data: { ...endpointRow, organization_id: OTHER },
        error: null,
      } as MockResult);
      supabase.from.mockImplementation((table: string) => {
        if (table === "webhook_dead_letters") return deadLetterBuilder;
        if (table === "webhook_endpoints") return endpointBuilder;
        return deliveryBuilder;
      });

      const res = await request(app)
        .post("/api/v1/webhook-endpoints/dead-letters/dl1/retry")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(404);
      expect(enqueueTask).not.toHaveBeenCalled();
      expect(deliveryBuilder.insert).not.toHaveBeenCalled();
      expect(deadLetterBuilder.delete).not.toHaveBeenCalled();
    });

    it("returns 404 when the dead letter does not exist", async () => {
      deadLetterBuilder = createMockBuilder({ data: null, error: null } as MockResult);
      supabase.from.mockImplementation((table: string) => {
        if (table === "webhook_dead_letters") return deadLetterBuilder;
        if (table === "webhook_endpoints") return endpointBuilder;
        return deliveryBuilder;
      });

      const res = await request(app)
        .post("/api/v1/webhook-endpoints/dead-letters/missing/retry")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(404);
      expect(enqueueTask).not.toHaveBeenCalled();
    });

    it("returns 404 when the endpoint no longer exists", async () => {
      endpointBuilder = createMockBuilder({ data: null, error: null } as MockResult);
      supabase.from.mockImplementation((table: string) => {
        if (table === "webhook_dead_letters") return deadLetterBuilder;
        if (table === "webhook_endpoints") return endpointBuilder;
        return deliveryBuilder;
      });

      const res = await request(app)
        .post("/api/v1/webhook-endpoints/dead-letters/dl1/retry")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(404);
      expect(enqueueTask).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /dead-letters/:id", () => {
    it("dismisses the dead letter and audits it", async () => {
      const res = await request(app)
        .delete("/api/v1/webhook-endpoints/dead-letters/dl1")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ ok: true });
      expect(deadLetterBuilder.delete).toHaveBeenCalled();
      expect(enqueueTask).not.toHaveBeenCalled();
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG,
          action: "webhook.dead_letter.dismissed",
          entityType: "webhook_dead_letter",
          entityId: "dl1",
        }),
      );
    });

    it("returns 404 when the endpoint is in another org", async () => {
      endpointBuilder = createMockBuilder({
        data: { ...endpointRow, organization_id: OTHER },
        error: null,
      } as MockResult);
      supabase.from.mockImplementation((table: string) => {
        if (table === "webhook_dead_letters") return deadLetterBuilder;
        if (table === "webhook_endpoints") return endpointBuilder;
        return deliveryBuilder;
      });

      const res = await request(app)
        .delete("/api/v1/webhook-endpoints/dead-letters/dl1")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(404);
      expect(deadLetterBuilder.delete).not.toHaveBeenCalled();
    });

    it("returns 404 when the dead letter does not exist", async () => {
      deadLetterBuilder = createMockBuilder({ data: null, error: null } as MockResult);
      supabase.from.mockImplementation((table: string) => {
        if (table === "webhook_dead_letters") return deadLetterBuilder;
        if (table === "webhook_endpoints") return endpointBuilder;
        return deliveryBuilder;
      });

      const res = await request(app)
        .delete("/api/v1/webhook-endpoints/dead-letters/missing")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(404);
      expect(logAuditEvent).not.toHaveBeenCalled();
    });
  });
});
