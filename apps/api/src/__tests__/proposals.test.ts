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
    getScopedClient: jest.fn((_req, _moduleKey, _kind) => require("../services/supabase").getSupabaseAdmin()),
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import proposalsRouter from "../routes/proposals";

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
app.use("/api/v1/proposals", proposalsRouter);
app.use(errorHandler);

describe("Proposals API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/proposals", () => {
    it("returns empty paginated list", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
      const res = await request(app).get("/api/v1/proposals").set("Authorization", authToken);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("items");
      expect(res.body.data.total).toBe(0);
    });
  });

  describe("POST /api/v1/proposals", () => {
    it("validates required fields", async () => {
      mockAuth();
      const res = await request(app)
        .post("/api/v1/proposals")
        .set("Authorization", authToken)
        .send({});
      expect(res.status).toBe(400);
    });

    it("validates title is required", async () => {
      mockAuth();
      const res = await request(app)
        .post("/api/v1/proposals")
        .set("Authorization", authToken)
        .send({ organizationId: testOrgId });
      expect(res.status).toBe(400);
    });

    it("creates a proposal successfully", async () => {
      const supabase = mockAuth();
      const mockProposal = {
        id: "pro-1",
        organization_id: testOrgId,
        title: "Test Proposal",
        status: "draft",
        grand_total: 1500,
        visibility: "internal",
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      supabase.from.mockReturnValue(createMockBuilder({ data: mockProposal, error: null }));
      const res = await request(app)
        .post("/api/v1/proposals")
        .set("Authorization", authToken)
        .send({
          organizationId: testOrgId,
          title: "Test Proposal",
          phases: [
            {
              title: "Phase 1",
              sortOrder: 0,
              items: [{ name: "Item 1", quantity: 10, unitPrice: 150 }],
            },
          ],
        });
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Test Proposal");
    });
  });

  describe("GET /api/v1/proposals/:id", () => {
    it("returns 404 for non-existent proposal", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
      const res = await request(app)
        .get("/api/v1/proposals/00000000-0000-0000-0000-000000000999")
        .set("Authorization", authToken);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/v1/proposals/:id/submit-approval", () => {
    it("validates organizationId is required", async () => {
      mockAuth();
      const res = await request(app)
        .post("/api/v1/proposals/00000000-0000-0000-0000-000000000070/submit-approval")
        .set("Authorization", authToken)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/proposals/export", () => {
    it("returns csv by default", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));
      const res = await request(app)
        .get("/api/v1/proposals/export")
        .set("Authorization", authToken);
      expect(res.status).toBe(200);
    });
  });
});

describe("Proposal tenant isolation (QW-1)", () => {
  const ORG_A = "00000000-0000-0000-0000-000000000001";
  const ORG_B = "00000000-0000-0000-0000-000000000002";
  const PROPOSAL_ID = "00000000-0000-0000-0000-0000000000c1";

  function mockProposal(orgId: string, extra: Record<string, unknown> = {}) {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: PROPOSAL_ID, organization_id: orgId, version: 1, ...extra },
        error: null,
      } as MockResult),
    );
    return supabase;
  }

  it("PATCH /:id succeeds when the proposal belongs to the caller's org", async () => {
    mockProposal(ORG_A);
    const res = await request(app)
      .patch(`/api/v1/proposals/${PROPOSAL_ID}`)
      .set("Authorization", authToken)
      .set("If-Match", "1")
      .send({ title: "Renamed" });
    expect(res.status).toBe(200);
    expect(res.body.data.organization_id).toBe(ORG_A);
  });

  it("PATCH /:id returns 404 when the proposal is in another org", async () => {
    mockProposal(ORG_B);
    const res = await request(app)
      .patch(`/api/v1/proposals/${PROPOSAL_ID}`)
      .set("Authorization", authToken)
      .set("If-Match", "1")
      .send({ title: "Renamed" });
    expect(res.status).toBe(404);
  });

  it("DELETE /:id succeeds when the proposal belongs to the caller's org", async () => {
    mockProposal(ORG_A);
    const res = await request(app)
      .delete(`/api/v1/proposals/${PROPOSAL_ID}`)
      .set("Authorization", authToken);
    expect(res.status).toBe(204);
  });

  it("DELETE /:id returns 404 when the proposal is in another org", async () => {
    mockProposal(ORG_B);
    const res = await request(app)
      .delete(`/api/v1/proposals/${PROPOSAL_ID}`)
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("POST /:id/phases succeeds when the proposal belongs to the caller's org", async () => {
    mockProposal(ORG_A);
    const res = await request(app)
      .post(`/api/v1/proposals/${PROPOSAL_ID}/phases`)
      .set("Authorization", authToken)
      .send({ title: "Phase 1" });
    expect(res.status).toBe(201);
  });

  it("POST /:id/phases returns 404 when the proposal is in another org", async () => {
    mockProposal(ORG_B);
    const res = await request(app)
      .post(`/api/v1/proposals/${PROPOSAL_ID}/phases`)
      .set("Authorization", authToken)
      .send({ title: "Phase 1" });
    expect(res.status).toBe(404);
  });

  it("PATCH /:id/phases/:phaseId returns 404 when the proposal is in another org", async () => {
    mockProposal(ORG_B);
    const res = await request(app)
      .patch(`/api/v1/proposals/${PROPOSAL_ID}/phases/00000000-0000-0000-0000-0000000000p1`)
      .set("Authorization", authToken)
      .send({ title: "Renamed" });
    expect(res.status).toBe(404);
  });

  it("DELETE /:id/phases/:phaseId returns 404 when the proposal is in another org", async () => {
    mockProposal(ORG_B);
    const res = await request(app)
      .delete(`/api/v1/proposals/${PROPOSAL_ID}/phases/00000000-0000-0000-0000-0000000000p1`)
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("POST /:id/items succeeds when the proposal belongs to the caller's org", async () => {
    mockProposal(ORG_A);
    const res = await request(app)
      .post(`/api/v1/proposals/${PROPOSAL_ID}/items`)
      .set("Authorization", authToken)
      .send({ name: "Item 1", itemType: "labor" });
    expect(res.status).toBe(201);
  });

  it("POST /:id/items returns 404 when the proposal is in another org", async () => {
    mockProposal(ORG_B);
    const res = await request(app)
      .post(`/api/v1/proposals/${PROPOSAL_ID}/items`)
      .set("Authorization", authToken)
      .send({ name: "Item 1", itemType: "labor" });
    expect(res.status).toBe(404);
  });

  it("PATCH /:id/items/:itemId returns 404 when the proposal is in another org", async () => {
    mockProposal(ORG_B);
    const res = await request(app)
      .patch(`/api/v1/proposals/${PROPOSAL_ID}/items/00000000-0000-0000-0000-0000000000i1`)
      .set("Authorization", authToken)
      .send({ name: "Renamed" });
    expect(res.status).toBe(404);
  });

  it("DELETE /:id/items/:itemId returns 404 when the proposal is in another org", async () => {
    mockProposal(ORG_B);
    const res = await request(app)
      .delete(`/api/v1/proposals/${PROPOSAL_ID}/items/00000000-0000-0000-0000-0000000000i1`)
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("GET /:id/comments returns 404 when the parent proposal is in another org", async () => {
    mockProposal(ORG_B);
    const res = await request(app)
      .get(`/api/v1/proposals/${PROPOSAL_ID}/comments`)
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("POST /:id/comments returns 404 when the parent proposal is in another org", async () => {
    mockProposal(ORG_B);
    const res = await request(app)
      .post(`/api/v1/proposals/${PROPOSAL_ID}/comments`)
      .set("Authorization", authToken)
      .send({ body: "hi" });
    expect(res.status).toBe(404);
  });

  it("GET /:id/timeline returns 404 when the parent proposal is in another org", async () => {
    mockProposal(ORG_B);
    const res = await request(app)
      .get(`/api/v1/proposals/${PROPOSAL_ID}/timeline`)
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("POST /:id/submit-approval returns 404 when the proposal is in another org", async () => {
    mockProposal(ORG_B);
    const res = await request(app)
      .post(`/api/v1/proposals/${PROPOSAL_ID}/submit-approval`)
      .set("Authorization", authToken)
      .send({ organizationId: ORG_A });
    expect(res.status).toBe(404);
  });

  it("POST /:id/publish returns 404 when the proposal is in another org", async () => {
    mockProposal(ORG_B);
    const res = await request(app)
      .post(`/api/v1/proposals/${PROPOSAL_ID}/publish`)
      .set("Authorization", authToken)
      .send({ organizationId: ORG_A, validityDays: 30 });
    expect(res.status).toBe(404);
  });
});
