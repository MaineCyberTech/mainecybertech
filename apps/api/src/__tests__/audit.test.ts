import { jest } from "@jest/globals";
import request from "supertest";
import auditRouter from "../routes/audit";
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
  const supabase: { from: jest.Mock; auth: { getUser: jest.Mock } } = {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "admin-1", email: "admin@example.com" } },
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

const AUDIT_ENTRY = {
  id: "audit-1",
  action: "test.action",
  entity_type: "test",
  created_at: "2026-01-01T00:00:00Z",
};

const app = createTestApp();
app.use("/api/v1/audit", auditRouter);
app.use(errorHandler);

describe("audit routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns paginated audit logs (admin only)", async () => {
      const supabase = mockAdmin();
      supabase.from
        .mockReturnValue(createMockBuilder({
          data: [AUDIT_ENTRY],
          error: null,
          count: 1,
        }));

      const res = await request(app)
        .get("/api/v1/audit")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });

    it("returns 403 when not an admin", async () => {
      const supabase = mockAuth();
      supabase.from
        .mockReturnValueOnce(createMockBuilder({ data: [], error: null }));

      const res = await request(app)
        .get("/api/v1/audit")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(403);
    });

    it("supports actor_user_id filter", async () => {
      const supabase = mockAdmin();
      supabase.from
        .mockReturnValue(createMockBuilder({
          data: [AUDIT_ENTRY],
          error: null,
          count: 1,
        }));

      const res = await request(app)
        .get("/api/v1/audit?actor_user_id=user-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
    });
  });
});
