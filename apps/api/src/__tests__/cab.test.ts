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
import cabRouter from "../routes/cab";

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
app.use("/api/v1/cab", cabRouter);
app.use(errorHandler);

describe("CAB API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty meeting list", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const res = await request(app).get("/api/v1/cab/meetings").set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });

  it("validates required fields on create", async () => {
    mockAuth();
    const res = await request(app)
      .post("/api/v1/cab/meetings")
      .set("Authorization", authToken)
      .send({});
    expect(res.status).toBe(400);
  });

  it("creates a meeting", async () => {
    const supabase = mockAuth();
    const insertBuilder = createMockBuilder({
      data: {
        id: "m-1",
        organization_id: testOrgId,
        status: "scheduled",
        scheduled_at: null,
        notes: null,
      },
      error: null,
    });
    supabase.from.mockReturnValue(insertBuilder);
    const res = await request(app)
      .post("/api/v1/cab/meetings")
      .set("Authorization", authToken)
      .send({ organizationId: testOrgId, status: "scheduled" });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe("m-1");
  });

  it("rejects invalid decision on agenda update", async () => {
    mockAuth();
    const res = await request(app)
      .patch("/api/v1/cab/agenda/a-1")
      .set("Authorization", authToken)
      .send({ decision: "maybe" });
    expect(res.status).toBe(400);
  });

  describe("Tenant isolation (QW-1)", () => {
    const ORG_A = "00000000-0000-0000-0000-000000000001";
    const ORG_B = "00000000-0000-0000-0000-000000000002";

    it("GET /meetings/:id returns 404 when the meeting is in another org", async () => {
      const s = mockAuth();
      s.from.mockReturnValue(
        createMockBuilder({ data: { id: "m-1", organization_id: ORG_B }, error: null }),
      );
      const res = await request(app)
        .get("/api/v1/cab/meetings/m-1")
        .set("Authorization", authToken);
      expect(res.status).toBe(404);
    });

    it("GET /meetings/:id succeeds when the meeting belongs to the caller's org", async () => {
      const s = mockAuth();
      s.from
        .mockReturnValueOnce(
          createMockBuilder({ data: { id: "m-1", organization_id: ORG_A }, error: null }),
        )
        .mockReturnValue(createMockBuilder({ data: [], error: null }));
      const res = await request(app)
        .get("/api/v1/cab/meetings/m-1")
        .set("Authorization", authToken);
      expect(res.status).toBe(200);
    });

    it("PATCH /agenda/:id returns 404 when the item is in another org", async () => {
      const s = mockAuth();
      s.from.mockReturnValue(
        createMockBuilder({ data: { id: "a-1", organization_id: ORG_B }, error: null }),
      );
      const res = await request(app)
        .patch("/api/v1/cab/agenda/a-1")
        .set("Authorization", authToken)
        .send({ decision: "approved" });
      expect(res.status).toBe(404);
    });

    it("PATCH /agenda/:id succeeds when the item belongs to the caller's org", async () => {
      const s = mockAuth();
      s.from
        .mockReturnValueOnce(
          createMockBuilder({ data: { id: "a-1", organization_id: ORG_A }, error: null }),
        )
        .mockReturnValue(
          createMockBuilder({ data: { id: "a-1", organization_id: ORG_A, decision: "approved" }, error: null }),
        );
      const res = await request(app)
        .patch("/api/v1/cab/agenda/a-1")
        .set("Authorization", authToken)
        .send({ decision: "approved" });
      expect(res.status).toBe(200);
    });

    it("POST /meetings/:id/agenda returns 404 when the meeting is in another org", async () => {
      const s = mockAuth();
      s.from.mockReturnValue(
        createMockBuilder({ data: { id: "m-1", organization_id: ORG_B }, error: null }),
      );
      const res = await request(app)
        .post("/api/v1/cab/meetings/m-1/agenda")
        .set("Authorization", authToken)
        .send({ organizationId: ORG_A, changeRequestId: "00000000-0000-0000-0000-0000000000c1", decision: "approved" });
      expect(res.status).toBe(404);
    });

    it("POST /meetings/:id/agenda succeeds when the meeting belongs to the caller's org", async () => {
      const s = mockAuth();
      s.from
        .mockReturnValueOnce(
          createMockBuilder({ data: { id: "m-1", organization_id: ORG_A }, error: null }),
        )
        .mockReturnValue(
          createMockBuilder({ data: { id: "a-2", organization_id: ORG_A, decision: "approved" }, error: null }),
        );
      const res = await request(app)
        .post("/api/v1/cab/meetings/m-1/agenda")
        .set("Authorization", authToken)
        .send({ organizationId: ORG_A, changeRequestId: "00000000-0000-0000-0000-0000000000c1", decision: "approved" });
      expect(res.status).toBe(201);
    });
  });
});
