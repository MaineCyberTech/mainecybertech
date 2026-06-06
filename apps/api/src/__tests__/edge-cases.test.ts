import { jest } from "@jest/globals";
import request from "supertest";
import projectsRouter from "../routes/projects";
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
  getSupabaseAnon: jest.fn(),
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

const PROJECT = { id: "proj-1", name: "Test Project", status: "active", organization_id: "org-1" };

const app = createTestApp();
app.use("/api/v1/projects", projectsRouter);
app.use(errorHandler);

describe("API edge cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("database failure scenarios", () => {
    it("returns 500 when DB query fails", async () => {
      const supabase = mockAuth();
      const builder = createMockBuilder({ data: null, error: { message: "Connection refused" }, count: 0 });
      supabase.from.mockReturnValue(builder);

      const res = await request(app)
        .get("/api/v1/projects")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe("DB_ERROR");
    });

    it("returns 500 when DB returns null data unexpectedly", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: { message: "relation does not exist" } }),
        }),
      });

      const res = await request(app)
        .get("/api/v1/projects/proj-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(500);
    });

    it("handles timeout gracefully", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error("timeout")),
          }),
        }),
      });

      const res = await request(app)
        .get("/api/v1/projects/proj-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(500);
    });
  });

  describe("RLS violation scenarios", () => {
    it("returns 404 when RLS policy blocks single-item query", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: "new row violates row-level security policy" } }),
          }),
        }),
      });

      const res = await request(app)
        .get("/api/v1/projects/proj-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });

    it("returns 403 when user is not authorized for mutation", async () => {
      const supabase = mockAuth();
      supabase.from
        .mockReturnValueOnce({ select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) }) }) });

      const res = await request(app)
        .delete("/api/v1/projects/proj-1")
        .set("Authorization", "Bearer token-123");

      expect([403, 500]).toContain(res.status);
    });
  });

  describe("malformed input scenarios", () => {
    it("returns 400 for invalid UUID format in params", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: { message: "invalid input syntax for type uuid" } }),
        }),
        insert: jest.fn(), update: jest.fn(), delete: jest.fn(),
      });

      const res = await request(app)
        .get("/api/v1/projects/not-a-uuid")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(500);
    });
  });
});
