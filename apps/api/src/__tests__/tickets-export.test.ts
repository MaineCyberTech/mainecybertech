import { jest } from "@jest/globals";
import request from "supertest";
import ticketsRouter from "../routes/tickets";
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
app.use("/api/v1/tickets", ticketsRouter);
app.use(errorHandler);

describe("Ticket export endpoint", () => {
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
            id: "t1",
            title: "Test ticket",
            status: "new",
            priority: "normal",
            organization_id: "org-1",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
        ],
        error: null,
      } as MockResult),
    );

    const res = await request(app)
      .get("/api/v1/tickets/export")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.text).toContain("id");
    expect(res.text).toContain("title");
    expect(res.text).toContain("t1");
    expect(res.text).toContain("Test ticket");
  });

  it("GET /export?format=json returns JSON", async () => {
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: [{ id: "t1", title: "Ticket" }],
        error: null,
      } as MockResult),
    );

    const res = await request(app)
      .get("/api/v1/tickets/export?format=json")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /export filters by organization_id", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null } as MockResult));

    await request(app)
      .get("/api/v1/tickets/export?organization_id=org-1")
      .set("Authorization", "Bearer token");

    const chain = supabase.from.mock.results[0].value;
    expect(chain.eq).toHaveBeenCalledWith("organization_id", "org-1");
  });

  it("GET /export filters by status", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null } as MockResult));

    await request(app)
      .get("/api/v1/tickets/export?status=closed")
      .set("Authorization", "Bearer token");

    const chain = supabase.from.mock.results[0].value;
    expect(chain.eq).toHaveBeenCalledWith("status", "closed");
  });

  it("GET /export returns 401 without auth", async () => {
    const res = await request(app).get("/api/v1/tickets/export");
    expect(res.status).toBe(401);
  });
});
