import { jest } from "@jest/globals";
import request from "supertest";
import searchPortalRouter from "../routes/search-portal";
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
app.use("/api/v1/search/portal", searchPortalRouter);
app.use(errorHandler);

describe("search portal routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCache();
  });

  describe("GET /", () => {
    it("returns empty results when query is empty", async () => {
      mockAuth();

      const res = await request(app)
        .get("/api/v1/search/portal")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ tickets: [], projects: [] });
    });

    it("returns empty results when query is too short", async () => {
      mockAuth();

      const res = await request(app)
        .get("/api/v1/search/portal?q=a")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ tickets: [], projects: [] });
    });

    it("returns empty results when user has no memberships", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));

      const res = await request(app)
        .get("/api/v1/search/portal?q=test")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ tickets: [], projects: [] });
    });

    it("returns search results", async () => {
      const supabase = mockAuth();
      const mockTickets = [{ id: "t1", title: "Test Ticket", status: "open", priority: "high" }];
      const mockProjects = [{ id: "p1", name: "Test Project", status: "active", priority: "medium" }];

      supabase.from.mockImplementation((table: string) => {
        if (table === "memberships") {
          return createMockBuilder({ data: [{ organization_id: "org-1" }], error: null });
        }
        const builder = createMockBuilder({
          data: table === "tickets" ? mockTickets : mockProjects,
          error: null,
        });
        (builder as any).or = jest.fn(() => builder);
        return builder;
      });

      const res = await request(app)
        .get("/api/v1/search/portal?q=test")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.tickets).toEqual(mockTickets);
      expect(res.body.data.projects).toEqual(mockProjects);
    });
  });
});
