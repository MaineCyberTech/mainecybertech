import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder } from "./helpers";
import { errorHandler } from "../middleware/error";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    JWT_SECRET: "test-jwt-secret",
    APP_BASE_URL: "http://localhost:3000",
    API_PORT: 4000,
    SMTP_HOST: "",
    SMTP_USER: "",
    SMTP_PASS: "",
    EMAIL_FROM: "noreply@test.local",
    SENTRY_DSN: "",
    STRIPE_SECRET_KEY: "",
    STRIPE_WEBHOOK_SECRET: "",
    PUBLIC_TRAFFIC_WEBHOOK_URL: "",
    PUBLIC_LEAD_WEBHOOK_URL: "",
    JSM_DOMAIN: "",
    JSM_EMAIL: "",
    JSM_API_TOKEN: "",
    JSM_SERVICEDESK_ID: "",
    JSM_REQUEST_TYPE_ID: "",
  }),
}));

jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn() }));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";
import networkDiagramsRouter from "../routes/network-diagrams";

const authToken = "Bearer test-token";
const testOrgId = "00000000-0000-0000-0000-000000000001";

function mockAuth() {
  const supabase = {
    from: jest.fn(),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return supabase;
}

/*
 * Route-level suite: auth/permission/subscription middleware is stubbed so
 * mocks serve route queries only. Enforcement itself is covered by the
 * dedicated middleware-*.test.ts suites.
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
const app = createTestApp();
app.use("/api/v1/network-diagrams", networkDiagramsRouter);
app.use(errorHandler);

describe("Network Diagrams API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty list", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const res = await request(app).get("/api/v1/network-diagrams").set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.total).toBe(0);
  });

  it("validates required fields on create", async () => {
    mockAuth();
    const res = await request(app)
      .post("/api/v1/network-diagrams")
      .set("Authorization", authToken)
      .send({});
    expect(res.status).toBe(400);
  });

  it("creates a network diagram", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "nd-1",
          organization_id: testOrgId,
          name: "Main Office",
          description: null,
          diagram: { nodes: [], edges: [] },
        },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/network-diagrams")
      .set("Authorization", authToken)
      .send({ organizationId: testOrgId, name: "Main Office" });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Main Office");
  });

  it("returns 404 for non-existent diagram", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
    const res = await request(app)
      .get("/api/v1/network-diagrams/00000000-0000-0000-0000-000000000999")
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("updates a network diagram", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: "nd-1", organization_id: testOrgId, name: "Renamed", description: null, diagram: { nodes: [], edges: [] } },
        error: null,
      }),
    );
    const res = await request(app)
      .patch("/api/v1/network-diagrams/nd-1")
      .set("Authorization", authToken)
      .send({ name: "Renamed" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Renamed");
  });

  it("deletes a network diagram", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
    const res = await request(app)
      .delete("/api/v1/network-diagrams/nd-1")
      .set("Authorization", authToken);
    expect(res.status).toBe(204);
  });
});
