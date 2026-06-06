import { jest } from "@jest/globals";
import request from "supertest";
import membershipsRouter from "../routes/memberships";
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

const MEMBERSHIP = { id: "mem-1", organization_id: "org-1", user_id: "user-1", role_id: "role-1", status: "approved" };

const app = createTestApp();
app.use("/api/v1/memberships", membershipsRouter);
app.use(errorHandler);

describe("memberships routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns memberships", async () => {
      mockAuth();
      const result: MockResult = { data: [MEMBERSHIP], error: null };
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/memberships")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("filters by organization_id", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: [], error: null }));

      const res = await request(app)
        .get("/api/v1/memberships?organization_id=org-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /mine", () => {
    it("returns current user memberships", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder({ data: [MEMBERSHIP], error: null }));

      const res = await request(app)
        .get("/api/v1/memberships/mine")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });
  });

  describe("POST /invite", () => {
    it("invites a user to an organization (admin only)", async () => {
      const supabase = mockAdmin();
      supabase.from
        .mockReturnValueOnce(createMockBuilder({ data: { id: "user-2" }, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: { id: "new-mem" }, error: null }));

      const res = await request(app)
        .post("/api/v1/memberships/invite")
        .set("Authorization", "Bearer token-123")
        .send({ organizationId: "org-1", email: "invitee@example.com", roleId: "role-1" });

      expect(res.status).toBe(201);
    });

    it("returns 404 when user email not found", async () => {
      const supabase = mockAdmin();
      supabase.from
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .post("/api/v1/memberships/invite")
        .set("Authorization", "Bearer token-123")
        .send({ organizationId: "org-1", email: "missing@example.com", roleId: "role-1" });

      expect(res.status).toBe(404);
    });

    it("returns 409 when membership already exists", async () => {
      const supabase = mockAdmin();
      supabase.from
        .mockReturnValueOnce(createMockBuilder({ data: { id: "user-2" }, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: { id: "existing-mem" }, error: null }));

      const res = await request(app)
        .post("/api/v1/memberships/invite")
        .set("Authorization", "Bearer token-123")
        .send({ organizationId: "org-1", email: "invitee@example.com", roleId: "role-1" });

      expect(res.status).toBe(409);
    });
  });

  describe("PATCH /:id", () => {
    it("updates a membership (admin only)", async () => {
      const supabase = mockAdmin();
      supabase.from
        .mockReturnValue(createMockBuilder({ data: { ...MEMBERSHIP, status: "approved" }, error: null }));

      const res = await request(app)
        .patch("/api/v1/memberships/mem-1")
        .set("Authorization", "Bearer token-123")
        .send({ roleId: "role-1", status: "approved" });

      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /:id", () => {
    it("deletes a membership (admin only)", async () => {
      const supabase = mockAdmin();
      supabase.from
        .mockReturnValue(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .delete("/api/v1/memberships/mem-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(204);
    });
  });
});
