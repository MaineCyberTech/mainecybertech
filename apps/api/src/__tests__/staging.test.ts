import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder, createOrgAccessStub } from "./helpers";
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
import stagingRouter from "../routes/staging";

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

jest.mock("../middleware/org-access", () =>
  createOrgAccessStub("00000000-0000-0000-0000-000000000001"),
);
jest.mock("../middleware/permissions", () => ({
  requirePermission:
    () =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
}));
const app = createTestApp();
app.use("/api/v1/staging", stagingRouter);
app.use(errorHandler);

describe("Hardware Staging API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty list", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const res = await request(app).get("/api/v1/staging").set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.page).toBe(1);
  });

  it("validates required fields on create", async () => {
    mockAuth();
    const res = await request(app)
      .post("/api/v1/staging")
      .set("Authorization", authToken)
      .send({});
    expect(res.status).toBe(400);
  });

  it("creates a staging check", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "sc-1",
          organization_id: testOrgId,
          device_name: "Surface Laptop 5",
          status: "pending",
          checklist: [],
        },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/staging")
      .set("Authorization", authToken)
      .send({ organizationId: testOrgId, deviceName: "Surface Laptop 5" });
    expect(res.status).toBe(201);
    expect(res.body.data.device_name).toBe("Surface Laptop 5");
  });

  it("returns 404 for missing staging check", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
    const res = await request(app)
      .get("/api/v1/staging/00000000-0000-0000-0000-000000000999")
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("updates a staging check", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: "sc-1", organization_id: testOrgId, device_name: "Renamed", status: "pending", checklist: [] },
        error: null,
      }),
    );
    const res = await request(app)
      .patch("/api/v1/staging/sc-1")
      .set("Authorization", authToken)
      .send({ deviceName: "Renamed" });
    expect(res.status).toBe(200);
    expect(res.body.data.device_name).toBe("Renamed");
  });

  it("deletes a staging check", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({ data: { id: "sc-1", organization_id: testOrgId }, error: null }),
    );
    const res = await request(app)
      .delete("/api/v1/staging/sc-1")
      .set("Authorization", authToken);
    expect(res.status).toBe(204);
  });
});

describe("Hardware Staging tenant isolation", () => {
  const ORG_A = "00000000-0000-0000-0000-000000000001";
  const ORG_B = "00000000-0000-0000-0000-000000000002";
  const CHECK_ID = "00000000-0000-0000-0000-0000000000c1";

  function mockCheck(orgId: string) {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: CHECK_ID, organization_id: orgId, device_name: "Check", status: "pending", checklist: [] },
        error: null,
      }),
    );
    return supabase;
  }

  it("PATCH /:id succeeds when the check belongs to the caller's org", async () => {
    mockCheck(ORG_A);
    const res = await request(app)
      .patch(`/api/v1/staging/${CHECK_ID}`)
      .set("Authorization", authToken)
      .send({ deviceName: "Renamed" });
    expect(res.status).toBe(200);
    expect(res.body.data.organization_id).toBe(ORG_A);
  });

  it("PATCH /:id returns 404 when the check is in another org", async () => {
    mockCheck(ORG_B);
    const res = await request(app)
      .patch(`/api/v1/staging/${CHECK_ID}`)
      .set("Authorization", authToken)
      .send({ deviceName: "Renamed" });
    expect(res.status).toBe(404);
  });

  it("DELETE /:id succeeds when the check belongs to the caller's org", async () => {
    mockCheck(ORG_A);
    const res = await request(app)
      .delete(`/api/v1/staging/${CHECK_ID}`)
      .set("Authorization", authToken);
    expect(res.status).toBe(204);
  });

  it("DELETE /:id returns 404 when the check is in another org", async () => {
    mockCheck(ORG_B);
    const res = await request(app)
      .delete(`/api/v1/staging/${CHECK_ID}`)
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });
});
