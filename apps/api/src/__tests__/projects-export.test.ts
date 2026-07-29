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
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

jest.mock("../lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { getSupabaseAdmin } from "../services/supabase";

const app = createTestApp();
app.use("/api/v1/projects", projectsRouter);
app.use(errorHandler);

describe("Project export endpoint", () => {
  let supabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    supabase = {
      from: jest.fn(),
      auth: { getUser: jest.fn() },
    };
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@test.com" } },
      error: null,
    });
  });

  it("GET /export returns CSV by default", async () => {
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: [
          {
            id: "p1",
            name: "Project Alpha",
            status: "active",
            priority: "high",
            organization_id: "00000000-0000-0000-0000-000000000001",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
        ],
        error: null,
      } as MockResult),
    );

    const res = await request(app)
      .get("/api/v1/projects/export")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.text).toContain("id");
    expect(res.text).toContain("name");
    expect(res.text).toContain("Project Alpha");
  });

  it("GET /export?format=json returns JSON", async () => {
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: [{ id: "p1", name: "Project" }],
        error: null,
      } as MockResult),
    );

    const res = await request(app)
      .get("/api/v1/projects/export?format=json")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /export filters by organization_id", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null } as MockResult));

    await request(app)
      .get("/api/v1/projects/export?organization_id=00000000-0000-0000-0000-000000000001")
      .set("Authorization", "Bearer token");

    const chain = supabase.from.mock.results[0].value;
    expect(chain.eq).toHaveBeenCalledWith(
      "organization_id",
      "00000000-0000-0000-0000-000000000001",
    );
  });

  it("GET /export filters by status", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null } as MockResult));

    await request(app)
      .get("/api/v1/projects/export?status=completed")
      .set("Authorization", "Bearer token");

    const chain = supabase.from.mock.results[0].value;
    expect(chain.eq).toHaveBeenCalledWith("status", "completed");
  });

  it("GET /export returns 401 without auth", async () => {
    const res = await request(app).get("/api/v1/projects/export");
    expect(res.status).toBe(401);
  });
});
