import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder , tableAwareFrom } from "./helpers";
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
jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn(),
    getScopedClient: jest.fn((_req, _moduleKey, _kind) => require("../services/supabase").getSupabaseAdmin()) }));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";
import vendorsRouter from "../routes/vendors";

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
app.use("/api/v1/vendors", vendorsRouter);
app.use(errorHandler);

describe("Vendors API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists contracts", async () => {
    const supabase = mockAuth();
    supabase.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null, count: 0 })));
    const res = await request(app)
      .get("/api/v1/vendors/vendor-contracts")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
  });

  it("lists contacts", async () => {
    const supabase = mockAuth();
    supabase.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null, count: 0 })));
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
    supabase.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null })));
    const res = await request(app)
      .get("/api/v1/vendors/vendor-contracts/renewals")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.total).toBe(0);
  });

  it("renewals route is NOT shadowed by /vendor-contracts/:id", async () => {
    const supabase = mockAuth();
    // null data: the /:id handler would 404 on this, the renewals handler
    // coerces to an empty list and returns 200.
    const builder = createMockBuilder({ data: null, error: null });
    supabase.from.mockImplementation(tableAwareFrom(builder));
    const res = await request(app)
      .get("/api/v1/vendors/vendor-contracts/renewals")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(builder.single).not.toHaveBeenCalled();
  });

  it("renewals runs the date-filtered query (lte on renewal_date)", async () => {
    const supabase = mockAuth();
    const builder = createMockBuilder({ data: [], error: null });
    supabase.from.mockImplementation(tableAwareFrom(builder));
    const res = await request(app)
      .get("/api/v1/vendors/vendor-contracts/renewals")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(builder.lte).toHaveBeenCalledWith("renewal_date", expect.any(String));
    expect(builder.gte).toHaveBeenCalledWith("renewal_date", expect.any(String));
  });

  it("creates a contract with renewal_date", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "vc-2",
          vendor_name: "AWS",
          service_name: "Cloud",
          renewal_date: "2026-12-01",
          status: "active",
        },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/vendors/vendor-contracts")
      .set("Authorization", authToken)
      .send({
        organizationId: testOrgId,
        vendorName: "AWS",
        serviceName: "Cloud Services",
        renewalDate: "2026-12-01",
        autoRenews: true,
        renewalNoticeDays: 60,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.renewal_date).toBe("2026-12-01");
  });

  it("updates a contract", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "vc-1",
          vendor_name: "Microsoft",
          service_name: "365",
          status: "expiring",
          renewal_date: "2026-12-01",
        },
        error: null,
      }),
    );
    const res = await request(app)
      .patch("/api/v1/vendors/vendor-contracts/vc-1?organization_id=" + testOrgId)
      .set("Authorization", authToken)
      .send({ status: "expiring", renewalDate: "2026-12-01" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("expiring");
  });

  it("deletes a contract", async () => {
    const supabase = mockAuth();
    supabase.from.mockImplementation(tableAwareFrom(createMockBuilder({ error: null })));
    const res = await request(app)
      .delete("/api/v1/vendors/vendor-contracts/vc-1?organization_id=" + testOrgId)
      .set("Authorization", authToken);
    expect(res.status).toBe(204);
  });

  it("gets a single contract", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: "vc-1", vendor_name: "Microsoft", service_name: "365", status: "active" },
        error: null,
      }),
    );
    const res = await request(app)
      .get("/api/v1/vendors/vendor-contracts/vc-1?organization_id=" + testOrgId)
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.vendor_name).toBe("Microsoft");
  });

  it("filters contracts by status", async () => {
    const supabase = mockAuth();
    supabase.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null, count: 0 })));
    const res = await request(app)
      .get("/api/v1/vendors/vendor-contracts")
      .query({ organization_id: testOrgId, status: "expiring" })
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
  });

  it("searches contracts by vendor name", async () => {
    const supabase = mockAuth();
    supabase.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null, count: 0 })));
    const res = await request(app)
      .get("/api/v1/vendors/vendor-contracts")
      .query({ organization_id: testOrgId, search: "Microsoft" })
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
  });

  it("renewals endpoint filters by organization_id", async () => {
    const supabase = mockAuth();
    supabase.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null })));
    const res = await request(app)
      .get("/api/v1/vendors/vendor-contracts/renewals")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/v1/vendors/vendor-contracts");
    expect(res.status).toBe(401);
  });
});
