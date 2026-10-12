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
    getScopedClient: jest.fn((_req, _moduleKey, _kind) => require("../services/supabase").getSupabaseAdmin()),
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

jest.mock("../lib/metrics", () => ({
  recordSearchQuery: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";

const ORG_A = "00000000-0000-0000-0000-000000000001";

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
      expect(res.body.data).toEqual({ tickets: [], projects: [], documents: [] });
    });

    it("returns empty results when query is too short", async () => {
      mockAuth();

      const res = await request(app)
        .get("/api/v1/search/portal?q=a")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ tickets: [], projects: [], documents: [] });
    });

    it("returns empty results when user has no memberships", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));

      const res = await request(app)
        .get("/api/v1/search/portal?q=test")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ tickets: [], projects: [], documents: [] });
    });

    it("returns search results", async () => {
      const supabase = mockAuth();
      const mockTickets = [{ id: "t1", title: "Test Ticket", status: "open", priority: "high" }];
      const mockProjects = [
        { id: "p1", name: "Test Project", status: "active", priority: "medium" },
      ];
      const orCalls: Record<string, string[]> = {};

      supabase.from.mockImplementation((table: string) => {
        if (table === "memberships") {
          return createMockBuilder({
            data: [{ organization_id: ORG_A }],
            error: null,
          });
        }
        if (table === "documents") {
          return createMockBuilder({ data: [], error: null });
        }
        const builder = createMockBuilder({
          data: table === "tickets" ? mockTickets : mockProjects,
          error: null,
        });
        (builder as any).or = jest.fn((filter: string) => {
          (orCalls[table] ??= []).push(filter);
          return builder;
        });
        return builder;
      });

      const res = await request(app)
        .get("/api/v1/search/portal?q=test")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.tickets).toEqual(mockTickets);
      expect(res.body.data.projects).toEqual(mockProjects);
      expect(res.body.data.documents).toEqual([]);
      // SEARCH-P2-006: both portal entities OR the generated full-text branch
      // onto the ILIKE substring predicates.
      for (const table of ["tickets", "projects"]) {
        expect(orCalls[table]?.[0]).toContain("search_vector.wfts(english).test");
      }
      // SEARCH-P2-005: the portal route now feeds the search counter.
      const { recordSearchQuery } = jest.requireMock("../lib/metrics") as {
        recordSearchQuery: jest.Mock;
      };
      expect(recordSearchQuery).toHaveBeenCalled();
    });

    it("returns readable documents and hides private ones [SEARCH-P2-002]", async () => {
      const supabase = mockAuth();
      const orgDoc = {
        id: "doc-org",
        name: "Org handbook",
        mime_type: "application/pdf",
        visibility: "org",
        organization_id: ORG_A,
        uploaded_by: "user-2",
      };
      const publicDoc = {
        id: "doc-public",
        name: "Public flyer",
        mime_type: "image/png",
        visibility: "public",
        organization_id: ORG_A,
        uploaded_by: "user-2",
      };
      const privateDoc = {
        id: "doc-private",
        name: "Private notes",
        mime_type: "application/pdf",
        visibility: "private",
        organization_id: ORG_A,
        uploaded_by: "user-2",
      };

      supabase.from.mockImplementation((table: string) => {
        let data: unknown = [];
        switch (table) {
          case "memberships":
            data = [
              {
                organization_id: ORG_A,
                role_id: "role-client-user",
                roles: [{ key: "client_user" }],
              },
            ];
            break;
          case "profiles":
            data = { is_super_admin: false };
            break;
          case "documents":
            data = [orgDoc, publicDoc, privateDoc];
            break;
          default:
            data = [];
        }
        const builder = createMockBuilder({ data, error: null });
        (builder as any).or = jest.fn(() => builder);
        return builder;
      });

      const res = await request(app)
        .get("/api/v1/search/portal?q=hand")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      // The visibility model matches admin search: org/public survive, private
      // (no uploader/role/grant match) is dropped.
      expect(res.body.data.documents.map((d: { id: string }) => d.id)).toEqual([
        "doc-org",
        "doc-public",
      ]);
    });
  });
});
