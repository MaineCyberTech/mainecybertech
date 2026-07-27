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
import licenseOptimizerRouter from "../routes/license-optimizer";

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

const app = createTestApp();
app.use("/api/v1/license-optimizer", licenseOptimizerRouter);
app.use(errorHandler);

describe("License Optimizer API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists licenses", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const res = await request(app)
      .get("/api/v1/license-optimizer")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
  });

  it("creates a license allocation", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "lic-1",
          software_name: "Microsoft 365",
          license_type: "per_seat",
          total_seats: 50,
          used_seats: 30,
        },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/license-optimizer")
      .set("Authorization", authToken)
      .send({
        organizationId: testOrgId,
        softwareName: "Microsoft 365",
        totalSeats: 50,
        usedSeats: 30,
        costPerSeat: 15,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.software_name).toBe("Microsoft 365");
  });

  it("gets a single license", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "lic-1",
          software_name: "Microsoft 365",
          total_seats: 50,
          used_seats: 30,
          status: "active",
        },
        error: null,
      }),
    );
    const res = await request(app)
      .get("/api/v1/license-optimizer/lic-1")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.software_name).toBe("Microsoft 365");
  });

  it("updates a license allocation", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: "lic-1", software_name: "Microsoft 365", used_seats: 35, status: "active" },
        error: null,
      }),
    );
    const res = await request(app)
      .patch("/api/v1/license-optimizer/lic-1")
      .set("Authorization", authToken)
      .send({ usedSeats: 35 });
    expect(res.status).toBe(200);
    expect(res.body.data.used_seats).toBe(35);
  });

  it("deletes a license allocation", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ error: null }));
    const res = await request(app)
      .delete("/api/v1/license-optimizer/lic-1")
      .set("Authorization", authToken);
    expect(res.status).toBe(204);
  });

  it("returns reclaimable licenses", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: [
          {
            id: "lic-1",
            software_name: "Zoom",
            total_seats: 100,
            used_seats: 30,
            cost_per_seat: 15,
            status: "active",
          },
          {
            id: "lic-2",
            software_name: "Slack",
            total_seats: 50,
            used_seats: 50,
            cost_per_seat: 8,
            status: "active",
          },
        ],
        error: null,
      }),
    );
    const res = await request(app)
      .get("/api/v1/license-optimizer/reclaimable/license-list")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.reclaimable).toHaveLength(1);
    expect(res.body.data.potentialSavings).toBe(1050);
  });

  it("returns summary data", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: [
          {
            id: "lic-1",
            software_name: "M365",
            total_seats: 100,
            used_seats: 30,
            cost_per_seat: 15,
            status: "active",
          },
          {
            id: "lic-2",
            software_name: "Zoom",
            total_seats: 50,
            used_seats: 50,
            cost_per_seat: 12,
            status: "active",
          },
        ],
        error: null,
      }),
    );
    const res = await request(app)
      .get("/api/v1/license-optimizer/summary/data")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.totalLicenses).toBe(2);
    expect(res.body.data.totalCost).toBe(2100);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/v1/license-optimizer");
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent license", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({ data: null, error: { message: "Not found" } }),
    );
    const res = await request(app)
      .get("/api/v1/license-optimizer/non-existent")
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });
});
