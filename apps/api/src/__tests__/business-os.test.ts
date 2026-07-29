import { jest } from "@jest/globals";
import request from "supertest";
import businessOsRouter from "../routes/business-os";
import { createTestApp, createMockBuilder } from "./helpers";
import { errorHandler } from "../middleware/error";
import { invalidateCache } from "../middleware/cache";

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

jest.mock("../middleware/admin", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
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

const app = createTestApp();
app.use("/api/v1/business-os", businessOsRouter);
app.use(errorHandler);

describe("business OS routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCache();
  });

  describe("GET /summary", () => {
    it("returns business summary with all metrics", async () => {
      const supabase = mockAuth();
      const mockOrgs = [
        {
          id: "00000000-0000-0000-0000-000000000001",
          name: "Org One",
          status: "approved",
          created_at: "2025-01-01T00:00:00Z",
        },
        { id: "org-2", name: "Org Two", status: "pending", created_at: "2025-02-01T00:00:00Z" },
      ];
      supabase.from.mockReturnValue(createMockBuilder({ data: mockOrgs, error: null, count: 10 }));

      const res = await request(app)
        .get("/api/v1/business-os/summary")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.organizations.total).toBe(2);
      expect(res.body.data.organizations.approved).toBe(1);
      expect(res.body.data.organizations.pending).toBe(1);
      expect(res.body.data.organizations.recent).toHaveLength(2);
      expect(res.body.data.tickets.open).toBe(10);
      expect(res.body.data.projects.active).toBe(10);
      expect(res.body.data.documents.total).toBe(10);
      expect(res.body.data.approvals.pending).toBe(10);
      expect(res.body.data.users.total).toBe(10);
    });

    it("returns 0 for null counts", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: null }));

      const res = await request(app)
        .get("/api/v1/business-os/summary")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        organizations: { total: 0, approved: 0, pending: 0, recent: [] },
        tickets: { open: 0 },
        projects: { active: 0 },
        documents: { total: 0 },
        approvals: { pending: 0 },
        users: { total: 0 },
      });
    });
  });
});
