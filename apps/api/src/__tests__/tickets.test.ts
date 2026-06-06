import { jest } from "@jest/globals";
import request from "supertest";
import ticketsRouter from "../routes/tickets";
import { createTestApp, createMockBuilder, type MockResult } from "./helpers";
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
  
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";

function mockAuth() {
  const supabase = { from: jest.fn(), auth: { getUser: jest.fn() }, rpc: jest.fn() };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@example.com" } },
    error: null,
  });
  return supabase;
}

const TICKET = { id: "ticket-1", title: "Test Ticket", status: "open", priority: "medium" };
const COMMENT = { id: "comment-1", ticket_id: "ticket-1", body: "Test comment" };

const app = createTestApp();
app.use("/api/v1/tickets", ticketsRouter);
app.use(errorHandler);

describe("tickets routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns paginated tickets", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: [TICKET], error: null, count: 1 }));

      const res = await request(app)
        .get("/api/v1/tickets")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });

    it("filters by organization_id", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));

      const res = await request(app)
        .get("/api/v1/tickets?organization_id=org-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /:id", () => {
    it("returns a ticket with relations", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: TICKET, error: null }));

      const res = await request(app)
        .get("/api/v1/tickets/ticket-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("ticket-1");
    });

    it("returns 404 when not found", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: null, error: new Error("Not found") }));

      const res = await request(app)
        .get("/api/v1/tickets/missing")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    it("creates a ticket", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: TICKET, error: null }));

      const res = await request(app)
        .post("/api/v1/tickets")
        .set("Authorization", "Bearer token-123")
        .send({ organizationId: "org-1", title: "Test Ticket", priority: "normal", source: "portal" });

      expect(res.status).toBe(201);
    });
  });

  describe("PATCH /:id", () => {
    it("updates a ticket", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: TICKET, error: null }));

      const res = await request(app)
        .patch("/api/v1/tickets/ticket-1")
        .set("Authorization", "Bearer token-123")
        .send({ title: "Updated Title" });

      expect(res.status).toBe(200);
    });
  });

  describe("GET /:id/comments", () => {
    it("returns comments for a ticket", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: [COMMENT], error: null }));

      const res = await request(app)
        .get("/api/v1/tickets/ticket-1/comments")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("POST /:id/comments", () => {
    it("adds a comment to a ticket", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: COMMENT, error: null }));

      const res = await request(app)
        .post("/api/v1/tickets/ticket-1/comments")
        .set("Authorization", "Bearer token-123")
        .send({ organizationId: "org-1", body: "New comment", isInternal: false });

      expect(res.status).toBe(201);
    });
  });
});
