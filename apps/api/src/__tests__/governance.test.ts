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
import router from "../routes/governance";

const auth = "Bearer test-token";
const org = "00000000-0000-0000-0000-000000000001";

function ma() {
  const s = {
    from: jest.fn(),
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: "u", email: "t" } }, error: null }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(s);
  return s;
}

const app = createTestApp();
app.use("/api/v1/governance", router);
app.use(errorHandler);

describe("Governance API", () => {
  beforeEach(() => jest.clearAllMocks());

  const paths = ["change-requests", "risks", "retention", "tabletop"];

  for (const path of paths) {
    it(`lists ${path}`, async () => {
      const s = ma();
      s.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
      const r = await request(app).get(`/api/v1/governance/${path}`).set("Authorization", auth);
      expect(r.status).toBe(200);
    });
  }

  it("gets a change request by ID", async () => {
    const s = ma();
    s.from.mockReturnValue(
      createMockBuilder({ data: { id: "ch-1", title: "FW Update" }, error: null }),
    );
    const r = await request(app)
      .get("/api/v1/governance/change-requests/ch-1")
      .set("Authorization", auth);
    expect(r.status).toBe(200);
  });

  it("creates a change request", async () => {
    const s = ma();
    s.from.mockReturnValue(
      createMockBuilder({ data: { id: "ch-1", title: "FW Update" }, error: null }),
    );
    const r = await request(app)
      .post("/api/v1/governance/change-requests")
      .set("Authorization", auth)
      .send({ organizationId: org, title: "FW Update", description: "Firewall firmware" });
    expect(r.status).toBe(201);
  });

  it("updates a change request", async () => {
    const s = ma();
    s.from.mockReturnValue(
      createMockBuilder({ data: { id: "ch-1", title: "Updated FW" }, error: null }),
    );
    const r = await request(app)
      .patch("/api/v1/governance/change-requests/ch-1")
      .set("Authorization", auth)
      .send({ title: "Updated FW" });
    expect(r.status).toBe(200);
  });

  it("PATCH /change-requests/:id strips state-machine fields (status/approved_by)", async () => {
    const s = ma();
    const builder = createMockBuilder({ data: { id: "ch-1", title: "Updated FW" }, error: null });
    s.from.mockReturnValue(builder);

    const r = await request(app)
      .patch(`/api/v1/governance/change-requests/ch-1?organization_id=${org}`)
      .set("Authorization", auth)
      .send({
        title: "Updated FW",
        status: "approved",
        approved_by: "attacker-user",
        approved_at: "2026-08-06T00:00:00Z",
      });

    expect(r.status).toBe(200);
    // Only editable content fields reach the UPDATE — status/approver columns
    // are not writable via PATCH (they are transition-only).
    expect(builder.update).toHaveBeenCalledWith({ title: "Updated FW" });
  });

  describe("change-request transitions", () => {
    it("approves a pending_review change request", async () => {
      const s = ma();
      s.from.mockReturnValue(
        createMockBuilder({
          data: { id: "ch-1", organization_id: org, status: "approved" },
          error: null,
        }),
      );
      const r = await request(app)
        .post(`/api/v1/governance/change-requests/ch-1/approve?organization_id=${org}`)
        .set("Authorization", auth);
      expect(r.status).toBe(200);
      expect(r.body.data.status).toBe("approved");
    });

    it("approve returns 404 for a change request in another org", async () => {
      const s = ma();
      s.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
      const r = await request(app)
        .post(`/api/v1/governance/change-requests/ch-1/approve?organization_id=${org}`)
        .set("Authorization", auth);
      expect(r.status).toBe(404);
      expect(r.body.error?.code).toBe("NOT_FOUND");
    });

    it("reject returns 404 for a change request in another org", async () => {
      const s = ma();
      s.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
      const r = await request(app)
        .post(`/api/v1/governance/change-requests/ch-1/reject?organization_id=${org}`)
        .set("Authorization", auth);
      expect(r.status).toBe(404);
    });

    it("implement returns 404 for a change request in another org", async () => {
      const s = ma();
      s.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
      const r = await request(app)
        .post(`/api/v1/governance/change-requests/ch-1/implement?organization_id=${org}`)
        .set("Authorization", auth);
      expect(r.status).toBe(404);
    });

    it("verify returns 404 for a change request in another org", async () => {
      const s = ma();
      s.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
      const r = await request(app)
        .post(`/api/v1/governance/change-requests/ch-1/verify?organization_id=${org}`)
        .set("Authorization", auth);
      expect(r.status).toBe(404);
    });

    it("submit returns 404 for a change request in another org", async () => {
      const s = ma();
      s.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
      const r = await request(app)
        .post(`/api/v1/governance/change-requests/ch-1/submit?organization_id=${org}`)
        .set("Authorization", auth);
      expect(r.status).toBe(404);
    });

    it("risks assess returns 404 for a risk in another org", async () => {
      const s = ma();
      s.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
      const r = await request(app)
        .post(`/api/v1/governance/risks/r-1/assess?organization_id=${org}`)
        .set("Authorization", auth)
        .send({ likelihood: 4, impact: 3 });
      expect(r.status).toBe(404);
    });
  });

  it("deletes a change request", async () => {
    const s = ma();
    s.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
    const r = await request(app)
      .delete("/api/v1/governance/change-requests/ch-1")
      .set("Authorization", auth);
    expect(r.status).toBe(204);
  });

  it("creates a risk entry", async () => {
    const s = ma();
    s.from.mockReturnValue(
      createMockBuilder({ data: { id: "r-1", riskDescription: "Phishing risk" }, error: null }),
    );
    const r = await request(app)
      .post("/api/v1/governance/risks")
      .set("Authorization", auth)
      .send({ organizationId: org, riskDescription: "Phishing risk" });
    expect(r.status).toBe(201);
  });

  it("returns 401 without auth token", async () => {
    const r = await request(app).get("/api/v1/governance/change-requests");
    expect(r.status).toBe(401);
  });
});
