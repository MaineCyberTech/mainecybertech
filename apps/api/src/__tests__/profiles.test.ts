import { jest } from "@jest/globals";
import request from "supertest";
import profilesRouter from "../routes/profiles";
import { createTestApp, createMockBuilder, type MockResult  } from "./helpers";
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
  getSupabaseUser: jest.fn(),
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

import { getSupabaseAdmin, getSupabaseUser } from "../services/supabase";

function mockAuth() {
  const supabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  (getSupabaseUser as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@example.com" } },
    error: null,
  });
  return supabase;
}

const PROFILE = {
  id: "prof-1",
  full_name: "Test User",
  email: "test@example.com",
  phone: null,
  title: "Engineer",
};

/*
 * Route-level suites: auth/permission middleware is stubbed so the shared
 * Supabase mock serves only route queries. Middleware enforcement itself is
 * covered by security-suite / edge-cases / dedicated middleware tests.
 */
jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireOrgAccessByParam: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock("../middleware/permissions", () => ({
  requirePermission:
    () =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
}));
jest.mock("../middleware/require-active-subscription", () => ({
  requireActiveSubscription: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const app = createTestApp();
app.use("/api/v1/profiles", profilesRouter);
app.use(errorHandler);

describe("profiles routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns a list of profiles", async () => {
      mockAuth();
      const result: MockResult = { data: [PROFILE], error: null };
      (getSupabaseUser as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/profiles")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("filters by ids", async () => {
      mockAuth();
      const result: MockResult = { data: [PROFILE], error: null };
      (getSupabaseUser as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/profiles?ids=prof-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /:id", () => {
    it("returns a profile by id (own profile)", async () => {
      const supabase = mockAuth();
      // authUser is user-1, requesting user-1 (own profile) â€” no admin check needed
      const result: MockResult = { data: PROFILE, error: null };
      (getSupabaseUser as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/profiles/user-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("prof-1");
    });

    it("returns a profile by id (admin viewing another user)", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValueOnce(
        createMockBuilder({ data: { is_super_admin: true }, error: null }),
      );
      const result: MockResult = { data: PROFILE, error: null };
      (getSupabaseUser as jest.Mock)().from.mockReturnValueOnce(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/profiles/prof-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("prof-1");
    });

    it("returns 404 when not found (admin viewing)", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValueOnce(
        createMockBuilder({ data: { is_super_admin: true }, error: null }),
      );
      const result: MockResult = {
        data: null,
        error: { message: "Not found", code: "PGRST116" },
      };
      (getSupabaseUser as jest.Mock)().from.mockReturnValueOnce(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/profiles/missing")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });

    it("returns 403 when non-admin views another user", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValueOnce(
        createMockBuilder({ data: { is_super_admin: false }, error: null }),
      );
      const res = await request(app)
        .get("/api/v1/profiles/prof-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /:id", () => {
    it("updates a profile", async () => {
      mockAuth();
      const updated = { ...PROFILE, full_name: "Updated Name" };
      const result: MockResult = { data: updated, error: null };
      (getSupabaseUser as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .patch("/api/v1/profiles/user-1")
        .set("Authorization", "Bearer token-123")
        .send({ fullName: "Updated Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.full_name).toBe("Updated Name");
    });

    it("returns 404 when profile not found", async () => {
      mockAuth();
      const result: MockResult = { data: null, error: null };
      (getSupabaseUser as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .patch("/api/v1/profiles/missing")
        .set("Authorization", "Bearer token-123")
        .send({ fullName: "Updated" });

      expect(res.status).toBe(403);
    });
  });
});
