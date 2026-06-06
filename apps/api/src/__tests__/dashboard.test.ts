import { jest } from "@jest/globals";
import request from "supertest";
import dashboardRouter from "../routes/dashboard";
import { createTestApp, createMockBuilder, type MockResult } from "./helpers";
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
app.use("/api/v1/dashboard", dashboardRouter);
app.use(errorHandler);

describe("dashboard routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCache();
  });

  describe("GET /summary", () => {
    it("returns counts for all dashboard metrics", async () => {
      const supabase = mockAuth();
      supabase.from
        .mockReturnValue(createMockBuilder({ data: null, error: null, count: 5 }));

      const res = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        managedServices: 5,
        openTickets: 5,
        activeProjects: 5,
        totalDocuments: 5,
        pendingMemberships: 5,
      });
      expect(supabase.from).toHaveBeenCalledTimes(5);
    });

    it("defaults null counts to 0", async () => {
      const supabase = mockAuth();
      supabase.from
        .mockReturnValue(createMockBuilder({ data: null, error: null, count: null }));

      const res = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        managedServices: 0,
        openTickets: 0,
        activeProjects: 0,
        totalDocuments: 0,
        pendingMemberships: 0,
      });
    });
  });
});
