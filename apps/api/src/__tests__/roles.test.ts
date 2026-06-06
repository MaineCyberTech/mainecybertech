import { jest } from "@jest/globals";
import request from "supertest";
import rolesRouter from "../routes/roles";
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
  const supabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@example.com" } },
    error: null,
  });
  return supabase;
}

const ROLE = { id: "role-1", key: "admin", name: "Admin" };

const app = createTestApp();
app.use("/api/v1/roles", rolesRouter);
app.use(errorHandler);

describe("roles routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns a list of roles", async () => {
      mockAuth();
      const result: MockResult = { data: [ROLE], error: null };
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/roles")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].key).toBe("admin");
    });

    it("filters by ids", async () => {
      mockAuth();
      const result: MockResult = { data: [ROLE], error: null };
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/roles?ids=role-1,role-2")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /:id", () => {
    it("returns a role by id", async () => {
      mockAuth();
      const result: MockResult = { data: ROLE, error: null };
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/roles/role-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("role-1");
    });

    it("returns 404 when not found", async () => {
      mockAuth();
      const result: MockResult = { data: null, error: new Error("Not found") };
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/roles/missing")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });
});
