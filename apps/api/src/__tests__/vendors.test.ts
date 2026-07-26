import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder } from "./helpers";
import { errorHandler } from "../middleware/error";

jest.mock("../config/env", () => ({
  getEnv: jest
    .fn()
    .mockReturnValue({
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
import vendorsRouter from "../routes/vendors";

const authToken = "Bearer test-token";
const testOrgId = "00000000-0000-0000-0000-000000000001";

function mockAuth() {
  const supabase = {
    from: jest.fn(),
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({
          data: { user: { id: "user-1", email: "test@example.com" } },
          error: null,
        }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return supabase;
}

const app = createTestApp();
app.use("/api/v1/vendors", vendorsRouter);
app.use(errorHandler);

describe("Vendors API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists contracts", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const res = await request(app)
      .get("/api/v1/vendors/vendor-contracts")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
  });

  it("lists contacts", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const res = await request(app)
      .get("/api/v1/vendors/vendor-contacts")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
  });

  it("creates a contract", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: "vc-1", vendor_name: "Microsoft", service_name: "365", status: "active" },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/vendors/vendor-contracts")
      .set("Authorization", authToken)
      .send({ organizationId: testOrgId, vendorName: "Microsoft", serviceName: "Microsoft 365" });
    expect(res.status).toBe(201);
  });

  it("creates a contact", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: "v-1", vendor_name: "Cisco", contact_name: "John" },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/vendors/vendor-contacts")
      .set("Authorization", authToken)
      .send({ organizationId: testOrgId, vendorName: "Cisco" });
    expect(res.status).toBe(201);
  });

  it("returns renewals", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));
    const res = await request(app)
      .get("/api/v1/vendors/vendor-contracts/renewals")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
  });
});
