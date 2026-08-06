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

const TICKET = {
  id: "00000000-0000-0000-0000-000000000010",
  title: "Test Ticket",
  status: "open",
  priority: "medium",
};
const COMMENT = {
  id: "comment-1",
  ticket_id: "00000000-0000-0000-0000-000000000010",
  body: "Test comment",
};

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
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: [TICKET], error: null, count: 1 }),
      );

      const res = await request(app)
        .get("/api/v1/tickets")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });

    it("filters by organization_id", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: [], error: null, count: 0 }),
      );

      const res = await request(app)
        .get("/api/v1/tickets?organization_id=00000000-0000-0000-0000-000000000001")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /:id", () => {
    it("returns a ticket with relations", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: TICKET, error: null }),
      );

      const res = await request(app)
        .get("/api/v1/tickets/00000000-0000-0000-0000-000000000010")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("00000000-0000-0000-0000-000000000010");
    });

    it("returns 404 when not found", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: null, error: new Error("Not found") }),
      );

      const res = await request(app)
        .get("/api/v1/tickets/00000000-0000-0000-0000-000000000999")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    it("creates a ticket", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: TICKET, error: null }),
      );

      const res = await request(app)
        .post("/api/v1/tickets")
        .set("Authorization", "Bearer token-123")
        .send({
          organizationId: "00000000-0000-0000-0000-000000000001",
          title: "Test Ticket",
          priority: "normal",
          source: "portal",
        });

      expect(res.status).toBe(201);
    });
  });

  describe("PATCH /:id", () => {
    it("updates a ticket", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: TICKET, error: null }),
      );

      const res = await request(app)
        .patch("/api/v1/tickets/00000000-0000-0000-0000-000000000010")
        .set("Authorization", "Bearer token-123")
        .send({ title: "Updated Title" });

      expect(res.status).toBe(200);
    });
  });

  describe("GET /:id/comments", () => {
    it("returns comments for a ticket", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: [COMMENT], error: null }),
      );

      const res = await request(app)
        .get("/api/v1/tickets/00000000-0000-0000-0000-000000000010/comments")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("POST /:id/comments", () => {
    it("adds a comment to a ticket", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: COMMENT, error: null }),
      );

      const res = await request(app)
        .post("/api/v1/tickets/00000000-0000-0000-0000-000000000010/comments")
        .set("Authorization", "Bearer token-123")
        .send({
          organizationId: "00000000-0000-0000-0000-000000000001",
          body: "New comment",
          isInternal: false,
        });

      expect(res.status).toBe(201);
    });
  });

  describe("PATCH /:id/comments/:commentId", () => {
    const ORG = "00000000-0000-0000-0000-000000000001";
    const OTHER_ORG = "00000000-0000-0000-0000-000000000002";

    function mockFromSequence(tableResults: Record<string, MockResult>) {
      const supabase = mockAuth();
      supabase.from.mockImplementation((table: string) => {
        return createMockBuilder(
          tableResults[table] ?? { data: null, error: new Error("not found") },
        );
      });
      return supabase;
    }

    it("allows the comment author to edit within the 5-minute window", async () => {
      const supabase = mockFromSequence({
        ticket_comments: {
          data: {
            id: "comment-1",
            author_id: "user-1",
            organization_id: ORG,
            body: "Original",
            created_at: new Date().toISOString(),
          },
          error: null,
        },
        tickets: { data: { id: "ticket-1", organization_id: ORG }, error: null },
      });

      const res = await request(app)
        .patch("/api/v1/tickets/ticket-1/comments/comment-1")
        .set("Authorization", "Bearer token-123")
        .send({ body: "Edited comment" });

      expect(res.status).toBe(200);
      expect(supabase.from).toHaveBeenCalledWith("ticket_comments");
      expect(supabase.from).toHaveBeenCalledWith("tickets");
    });

    it("rejects a non-author, non-admin user with 403", async () => {
      const supabase = mockFromSequence({
        ticket_comments: {
          data: {
            id: "comment-1",
            author_id: "another-user",
            organization_id: ORG,
            body: "Original",
            created_at: new Date().toISOString(),
          },
          error: null,
        },
        tickets: { data: { id: "ticket-1", organization_id: ORG }, error: null },
        memberships: { data: [], error: null },
      });

      const res = await request(app)
        .patch("/api/v1/tickets/ticket-1/comments/comment-1")
        .set("Authorization", "Bearer token-123")
        .send({ body: "Edited comment" });

      expect(res.status).toBe(403);
      expect(res.body.error?.message).toMatch(/comment author/i);
    });

    it("allows an org admin to edit a comment they did not author", async () => {
      const supabase = mockFromSequence({
        ticket_comments: {
          data: {
            id: "comment-1",
            author_id: "another-user",
            organization_id: ORG,
            body: "Original",
            created_at: new Date().toISOString(),
          },
          error: null,
        },
        tickets: { data: { id: "ticket-1", organization_id: ORG }, error: null },
        memberships: {
          data: [{ roles: { id: "role-1", key: "admin" } }],
          error: null,
        },
      });

      const res = await request(app)
        .patch("/api/v1/tickets/ticket-1/comments/comment-1")
        .set("Authorization", "Bearer token-123")
        .send({ body: "Edited by admin" });

      expect(res.status).toBe(200);
      expect(supabase.from).toHaveBeenCalledWith("memberships");
    });

    it("rejects edits when the caller is scoped to a different org than the comment", async () => {
      const supabase = mockFromSequence({
        ticket_comments: {
          data: {
            id: "comment-1",
            author_id: "user-1",
            organization_id: OTHER_ORG,
            body: "Original",
            created_at: new Date().toISOString(),
          },
          error: null,
        },
        tickets: { data: { id: "ticket-1", organization_id: OTHER_ORG }, error: null },
      });

      const res = await request(app)
        .patch(`/api/v1/tickets/ticket-1/comments/comment-1?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123")
        .send({ body: "Edited comment" });

      expect(res.status).toBe(403);
    });

    it("returns 404 when the comment's ticket is in a different org", async () => {
      mockFromSequence({
        ticket_comments: {
          data: {
            id: "comment-1",
            author_id: "user-1",
            organization_id: OTHER_ORG,
            body: "Original",
            created_at: new Date().toISOString(),
          },
          error: null,
        },
        tickets: { data: { id: "ticket-1", organization_id: ORG }, error: null },
      });

      const res = await request(app)
        .patch("/api/v1/tickets/ticket-1/comments/comment-1")
        .set("Authorization", "Bearer token-123")
        .send({ body: "Edited comment" });

      expect(res.status).toBe(404);
    });
  });

  describe("by-id tenant scoping", () => {
    const ORG = "00000000-0000-0000-0000-000000000001";

    it("PATCH /:id filters the fetch and update by organization_id", async () => {
      const supabase = mockAuth();
      const builder = createMockBuilder({ data: { version: 1 }, error: null });
      supabase.from.mockReturnValue(builder);

      const res = await request(app)
        .patch(`/api/v1/tickets/00000000-0000-0000-0000-000000000010?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123")
        .send({ title: "Updated Title" });

      expect(res.status).toBe(200);
      expect(builder.eq).toHaveBeenCalledWith("organization_id", ORG);
    });

    it("GET /:id/comments verifies the ticket belongs to the caller's org first", async () => {
      const supabase = mockAuth();
      const builders: Record<string, any> = {};
      supabase.from.mockImplementation((table: string) => {
        const builder = createMockBuilder({ data: [], error: null });
        builders[table] = builder;
        return builder;
      });

      const res = await request(app)
        .get(`/api/v1/tickets/00000000-0000-0000-0000-000000000010/comments?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      // The ticket fetch must be org-scoped before comments are returned
      expect(builders.tickets.eq).toHaveBeenCalledWith("organization_id", ORG);
      expect(supabase.from).toHaveBeenCalledWith("tickets");
      expect(supabase.from).toHaveBeenCalledWith("ticket_comments");
    });

    it("GET /:id/comments returns 404 when the ticket is in another org", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({ data: null, error: new Error("not found") }),
      );

      const res = await request(app)
        .get(
          `/api/v1/tickets/00000000-0000-0000-0000-000000000010/comments?organization_id=${ORG}`,
        )
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });

    it("DELETE /:id filters the fetch and delete by organization_id", async () => {
      const supabase = mockAuth();
      const builder = createMockBuilder({
        data: { id: "00000000-0000-0000-0000-000000000010", organization_id: ORG },
        error: null,
      });
      supabase.from.mockReturnValue(builder);

      const res = await request(app)
        .delete(`/api/v1/tickets/00000000-0000-0000-0000-000000000010?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(204);
      expect(builder.eq).toHaveBeenCalledWith("organization_id", ORG);
    });

    it("DELETE /:id returns 404 for a ticket in another org", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({ data: null, error: new Error("not found") }),
      );

      const res = await request(app)
        .delete(`/api/v1/tickets/00000000-0000-0000-0000-000000000010?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });

    it("POST /:id/comments verifies the ticket belongs to the caller's org", async () => {
      const supabase = mockAuth();
      const builders: Record<string, any> = {};
      supabase.from.mockImplementation((table: string) => {
        const builder = createMockBuilder({ data: COMMENT, error: null });
        builders[table] = builder;
        return builder;
      });

      const res = await request(app)
        .post(`/api/v1/tickets/00000000-0000-0000-0000-000000000010/comments?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123")
        .send({ organizationId: ORG, body: "New comment", isInternal: false });

      expect(res.status).toBe(201);
      // The ticket ownership fetch must be org-scoped before inserting
      expect(builders.tickets.eq).toHaveBeenCalledWith("organization_id", ORG);
    });

    it("POST /:id/comments returns 404 for a ticket in another org", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({ data: null, error: new Error("not found") }),
      );

      const res = await request(app)
        .post(`/api/v1/tickets/00000000-0000-0000-0000-000000000010/comments?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123")
        .send({ organizationId: ORG, body: "New comment", isInternal: false });

      expect(res.status).toBe(404);
      expect(res.body.error?.code).toBe("NOT_FOUND");
    });
  });
});
