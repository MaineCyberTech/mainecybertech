import { jest } from "@jest/globals";
import request from "supertest";
import organizationsRouter from "../routes/organizations";
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

function mockAdmin() {
  const supabase = mockAuth();
  supabase.from
    .mockReturnValueOnce(createMockBuilder({
      data: [{ roles: { id: "role-admin", key: "admin" } }],
      error: null,
    }));
  return supabase;
}

const ORG = { id: "org-1", name: "Test Org", slug: "test-org", status: "active" };
const DOMAIN = { id: "dom-1", organization_id: "org-1", domain: "example.com" };

const app = createTestApp();
app.use("/api/v1/organizations", organizationsRouter);
app.use(errorHandler);

describe("organizations routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns organizations", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: [ORG], error: null }));

      const res = await request(app)
        .get("/api/v1/organizations")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("filters by status", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: [ORG], error: null }));

      const res = await request(app)
        .get("/api/v1/organizations?status=active")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });

    it("filters by ids", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: [ORG], error: null }));

      const res = await request(app)
        .get("/api/v1/organizations?ids=org-1,org-2")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /:id", () => {
    it("returns an organization", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: ORG, error: null }));

      const res = await request(app)
        .get("/api/v1/organizations/org-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("org-1");
    });

    it("returns 404 when not found", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: null, error: new Error("Not found") }));

      const res = await request(app)
        .get("/api/v1/organizations/missing")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    it("creates an organization (admin only)", async () => {
      const supabase = mockAdmin();
      supabase.from
        .mockReturnValue(createMockBuilder({ data: ORG, error: null }));

      const res = await request(app)
        .post("/api/v1/organizations")
        .set("Authorization", "Bearer token-123")
        .send({ name: "Test Org", slug: "test-org" });

      expect(res.status).toBe(201);
    });
  });

  describe("PATCH /:id", () => {
    it("updates an organization (admin only)", async () => {
      const supabase = mockAdmin();
      supabase.from
        .mockReturnValue(createMockBuilder({ data: ORG, error: null }));

      const res = await request(app)
        .patch("/api/v1/organizations/org-1")
        .set("Authorization", "Bearer token-123")
        .send({ name: "Updated Org" });

      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /:id", () => {
    it("deletes an organization (admin only)", async () => {
      const supabase = mockAdmin();
      supabase.from
        .mockReturnValue(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .delete("/api/v1/organizations/org-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(204);
    });
  });

  describe("GET /:id/domains", () => {
    it("returns domains for an organization", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: [DOMAIN], error: null }));

      const res = await request(app)
        .get("/api/v1/organizations/org-1/domains")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("POST /:id/domains", () => {
    it("adds a domain (admin only)", async () => {
      const supabase = mockAdmin();
      supabase.from
        .mockReturnValue(createMockBuilder({ data: DOMAIN, error: null }));

      const res = await request(app)
        .post("/api/v1/organizations/org-1/domains")
        .set("Authorization", "Bearer token-123")
        .send({ domain: "example.com", autoApprove: true });

      expect(res.status).toBe(201);
    });
  });

  describe("PATCH /:id/domains/:domainId", () => {
    it("updates a domain (admin only)", async () => {
      const supabase = mockAdmin();
      supabase.from
        .mockReturnValue(createMockBuilder({ data: DOMAIN, error: null }));

      const res = await request(app)
        .patch("/api/v1/organizations/org-1/domains/dom-1")
        .set("Authorization", "Bearer token-123")
        .send({ autoApprove: false });

      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /:id/domains/:domainId", () => {
    it("deletes a domain (admin only)", async () => {
      const supabase = mockAdmin();
      supabase.from
        .mockReturnValue(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .delete("/api/v1/organizations/org-1/domains/dom-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(204);
    });
  });

  describe("GET /:id/detail", () => {
    it("returns compound organization detail in a single call", async () => {
      const supabase = mockAuth();
      const orgBuilder = createMockBuilder({ data: { id: "org-1", name: "Test Org", status: "active" }, error: null });
      const domainBuilder = createMockBuilder({ data: [{ id: "dom-1", domain: "test.com" }], error: null });
      const membershipBuilder = createMockBuilder({ data: [{ id: "m1", user_id: "user-1", role_id: "r1", status: "approved" }], error: null });
      const profileBuilder = createMockBuilder({ data: [{ id: "user-1", full_name: "Test", email: "t@t.com" }], error: null });
      const roleBuilder = createMockBuilder({ data: [{ id: "r1", key: "admin", name: "Admin" }], error: null });

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return orgBuilder;
        if (callCount === 2) return domainBuilder;
        if (callCount === 3) return membershipBuilder;
        if (callCount === 4) return profileBuilder;
        return roleBuilder;
      });

      const res = await request(app)
        .get("/api/v1/organizations/org-1/detail")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.organization).toBeDefined();
      expect(res.body.data.domains).toBeDefined();
      expect(res.body.data.memberships).toBeDefined();
      expect(res.body.data.profiles).toBeDefined();
      expect(res.body.data.roles).toBeDefined();
    });

    it("returns 404 when organization not found", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: null, error: { message: "Not found" } }));

      const res = await request(app)
        .get("/api/v1/organizations/nonexistent/detail")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });
});
