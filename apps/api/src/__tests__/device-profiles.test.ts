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
import deviceProfilesRouter from "../routes/device-profiles";

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
app.use("/api/v1/device-profiles", deviceProfilesRouter);
app.use(errorHandler);

describe("Device Profiles API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty list", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const res = await request(app).get("/api/v1/device-profiles").set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.page).toBe(1);
  });

  it("validates required fields on create", async () => {
    mockAuth();
    const res = await request(app)
      .post("/api/v1/device-profiles")
      .set("Authorization", authToken)
      .send({});
    expect(res.status).toBe(400);
  });

  it("creates a device profile", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "dp-1",
          organization_id: testOrgId,
          name: "Clinical Workstation Standard",
          type: "workstation",
          manufacturer: "Dell",
          model: "OptiPlex 7020",
          specs: { bitlocker: true },
        },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/device-profiles")
      .set("Authorization", authToken)
      .send({
        organizationId: testOrgId,
        name: "Clinical Workstation Standard",
        type: "workstation",
        manufacturer: "Dell",
        model: "OptiPlex 7020",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Clinical Workstation Standard");
  });

  it("gets a device profile by id", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: "dp-1", name: "Clinical Workstation Standard" },
        error: null,
        single: () => Promise.resolve({ data: { id: "dp-1", name: "Clinical Workstation Standard" }, error: null }),
      }),
    );
    const res = await request(app)
      .get("/api/v1/device-profiles/dp-1")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("dp-1");
  });

  it("returns 404 for missing device profile", async () => {
    const supabase = mockAuth();
    const builder = createMockBuilder({
      data: null,
      error: { message: "not found" },
    });
    builder.single = () => Promise.resolve({ data: null, error: { message: "not found" } });
    supabase.from.mockReturnValue(builder);
    const res = await request(app)
      .get("/api/v1/device-profiles/missing")
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("updates a device profile", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: "dp-1", organization_id: testOrgId, name: "Renamed" },
        error: null,
      }),
    );
    const res = await request(app)
      .patch("/api/v1/device-profiles/dp-1")
      .set("Authorization", authToken)
      .send({ name: "Renamed" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Renamed");
  });

  it("deletes a device profile", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({ data: { id: "dp-1", organization_id: testOrgId }, error: null }),
    );
    const res = await request(app)
      .delete("/api/v1/device-profiles/dp-1")
      .set("Authorization", authToken);
    expect(res.status).toBe(204);
  });
});

describe("Device Profiles tenant isolation", () => {
  const ORG_A = "00000000-0000-0000-0000-000000000001";
  const ORG_B = "00000000-0000-0000-0000-000000000002";
  const PROFILE_ID = "00000000-0000-0000-0000-0000000000d1";

  function mockProfile(orgId: string) {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({ data: { id: PROFILE_ID, organization_id: orgId, name: "Profile" }, error: null }),
    );
    return supabase;
  }

  it("PATCH /:id succeeds when the profile belongs to the caller's org", async () => {
    mockProfile(ORG_A);
    const res = await request(app)
      .patch(`/api/v1/device-profiles/${PROFILE_ID}`)
      .set("Authorization", authToken)
      .send({ name: "Renamed" });
    expect(res.status).toBe(200);
    expect(res.body.data.organization_id).toBe(ORG_A);
  });

  it("PATCH /:id returns 404 when the profile is in another org", async () => {
    mockProfile(ORG_B);
    const res = await request(app)
      .patch(`/api/v1/device-profiles/${PROFILE_ID}`)
      .set("Authorization", authToken)
      .send({ name: "Renamed" });
    expect(res.status).toBe(404);
  });

  it("DELETE /:id succeeds when the profile belongs to the caller's org", async () => {
    mockProfile(ORG_A);
    const res = await request(app)
      .delete(`/api/v1/device-profiles/${PROFILE_ID}`)
      .set("Authorization", authToken);
    expect(res.status).toBe(204);
  });

  it("DELETE /:id returns 404 when the profile is in another org", async () => {
    mockProfile(ORG_B);
    const res = await request(app)
      .delete(`/api/v1/device-profiles/${PROFILE_ID}`)
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });
});
