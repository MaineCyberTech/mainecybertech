import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder, createOrgAccessStub, type MockResult } from "./helpers";
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
    SMTP_PORT: 587,
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

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import approvalsRouter from "../routes/approvals";

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
app.use("/api/v1/approvals", approvalsRouter);
app.use(errorHandler);

describe("Approvals API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/approvals", () => {
    it("returns empty paginated list", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));

      const res = await request(app).get("/api/v1/approvals").set("Authorization", authToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("items");
      expect(res.body.data).toHaveProperty("total");
    });

    it("supports status filter query param", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));

      const res = await request(app)
        .get("/api/v1/approvals?status=pending")
        .set("Authorization", authToken);

      expect(res.status).toBe(200);
    });

    it("supports request_type filter query param", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));

      const res = await request(app)
        .get("/api/v1/approvals?request_type=proposal")
        .set("Authorization", authToken);

      expect(res.status).toBe(200);
    });

    it("supports search query param", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));

      const res = await request(app)
        .get("/api/v1/approvals?search=test")
        .set("Authorization", authToken);

      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/v1/approvals/stats", () => {
    it("returns stats object", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));

      const res = await request(app).get("/api/v1/approvals/stats").set("Authorization", authToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("total");
      expect(res.body.data).toHaveProperty("pending");
      expect(res.body.data).toHaveProperty("approved");
      expect(res.body.data).toHaveProperty("rejected");
    });
  });

  describe("POST /api/v1/approvals", () => {
    it("validates required fields with empty body", async () => {
      mockAuth();

      const res = await request(app)
        .post("/api/v1/approvals")
        .set("Authorization", authToken)
        .send({});

      expect(res.status).toBe(400);
    });

    it("validates requestType is required", async () => {
      mockAuth();

      const res = await request(app)
        .post("/api/v1/approvals")
        .set("Authorization", authToken)
        .send({
          organizationId: testOrgId,
          requestSubject: "Test approval",
        });

      expect(res.status).toBe(400);
    });

    it("creates an approval successfully", async () => {
      const supabase = mockAuth();
      const insertResult = {
        id: "00000000-0000-0000-0000-000000000010",
        organization_id: testOrgId,
        request_type: "proposal",
        request_subject: "New firewall proposal",
        status: "pending",
        priority: "normal",
        visibility: "internal",
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      supabase.from.mockReturnValue(createMockBuilder({ data: insertResult, error: null }));

      const res = await request(app)
        .post("/api/v1/approvals")
        .set("Authorization", authToken)
        .send({
          organizationId: testOrgId,
          requestType: "proposal",
          requestSubject: "New firewall proposal",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.request_type).toBe("proposal");
    });
  });

  describe("GET /api/v1/approvals/:id", () => {
    it("returns 404 for non-existent approval", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .get("/api/v1/approvals/00000000-0000-0000-0000-000000000099")
        .set("Authorization", authToken);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/v1/approvals/:id/approve", () => {
    it("validates organizationId is required", async () => {
      mockAuth();

      const res = await request(app)
        .post("/api/v1/approvals/00000000-0000-0000-0000-000000000099/approve")
        .set("Authorization", authToken)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/approvals/:id/reject", () => {
    it("validates reason is required", async () => {
      mockAuth();

      const res = await request(app)
        .post("/api/v1/approvals/00000000-0000-0000-0000-000000000099/reject")
        .set("Authorization", authToken)
        .send({ organizationId: testOrgId });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/approvals/:id/comments", () => {
    it("validates body is required", async () => {
      mockAuth();

      const res = await request(app)
        .post("/api/v1/approvals/00000000-0000-0000-0000-000000000099/comments")
        .set("Authorization", authToken)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/approvals/export", () => {
    it("returns csv by default", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));

      const res = await request(app)
        .get("/api/v1/approvals/export")
        .set("Authorization", authToken);

      expect(res.status).toBe(200);
    });
  });
});

describe("Approval tenant isolation (QW-1)", () => {
  const ORG_A = "00000000-0000-0000-0000-000000000001";
  const ORG_B = "00000000-0000-0000-0000-000000000002";
  const APPROVAL_ID = "00000000-0000-0000-0000-0000000000b1";

  function mockApproval(orgId: string, extra: Record<string, unknown> = {}) {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: APPROVAL_ID, organization_id: orgId, version: 1, ...extra },
        error: null,
      } as MockResult),
    );
    return supabase;
  }

  it("PATCH /:id succeeds when the approval belongs to the caller's org", async () => {
    mockApproval(ORG_A);
    const res = await request(app)
      .patch(`/api/v1/approvals/${APPROVAL_ID}`)
      .set("Authorization", authToken)
      .set("If-Match", "1")
      .send({ requestSubject: "Renamed" });
    expect(res.status).toBe(200);
    expect(res.body.data.organization_id).toBe(ORG_A);
  });

  it("PATCH /:id returns 404 when the approval is in another org", async () => {
    mockApproval(ORG_B);
    const res = await request(app)
      .patch(`/api/v1/approvals/${APPROVAL_ID}`)
      .set("Authorization", authToken)
      .set("If-Match", "1")
      .send({ requestSubject: "Renamed" });
    expect(res.status).toBe(404);
  });

  it("DELETE /:id succeeds when the approval belongs to the caller's org", async () => {
    mockApproval(ORG_A);
    const res = await request(app)
      .delete(`/api/v1/approvals/${APPROVAL_ID}`)
      .set("Authorization", authToken);
    expect(res.status).toBe(204);
  });

  it("DELETE /:id returns 404 when the approval is in another org", async () => {
    mockApproval(ORG_B);
    const res = await request(app)
      .delete(`/api/v1/approvals/${APPROVAL_ID}`)
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("GET /:id/comments returns 404 when the parent approval is in another org", async () => {
    mockApproval(ORG_B);
    const res = await request(app)
      .get(`/api/v1/approvals/${APPROVAL_ID}/comments`)
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("POST /:id/comments returns 404 when the parent approval is in another org", async () => {
    mockApproval(ORG_B);
    const res = await request(app)
      .post(`/api/v1/approvals/${APPROVAL_ID}/comments`)
      .set("Authorization", authToken)
      .send({ body: "hi" });
    expect(res.status).toBe(404);
  });

  it("GET /:id/timeline returns 404 when the parent approval is in another org", async () => {
    mockApproval(ORG_B);
    const res = await request(app)
      .get(`/api/v1/approvals/${APPROVAL_ID}/timeline`)
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("POST /:id/approve returns 404 when the approval is in another org", async () => {
    mockApproval(ORG_B);
    const res = await request(app)
      .post(`/api/v1/approvals/${APPROVAL_ID}/approve`)
      .set("Authorization", authToken)
      .send({ organizationId: ORG_A, notes: "ok" });
    expect(res.status).toBe(404);
  });

  it("POST /:id/reject returns 404 when the approval is in another org", async () => {
    mockApproval(ORG_B);
    const res = await request(app)
      .post(`/api/v1/approvals/${APPROVAL_ID}/reject`)
      .set("Authorization", authToken)
      .send({ organizationId: ORG_A, reason: "no" });
    expect(res.status).toBe(404);
  });

  it("POST /:id/cancel returns 404 when the approval is in another org", async () => {
    mockApproval(ORG_B);
    const res = await request(app)
      .post(`/api/v1/approvals/${APPROVAL_ID}/cancel`)
      .set("Authorization", authToken)
      .send({ organizationId: ORG_A, reason: "no" });
    expect(res.status).toBe(404);
  });
});
