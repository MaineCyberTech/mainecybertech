import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder  } from "./helpers";
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
jest.mock("../middleware/admin", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
import { getSupabaseAdmin } from "../services/supabase";
import router from "../routes/edu-automation";

const auth = "Bearer test-token";
const org = "00000000-0000-0000-0000-000000000001";

function mockSb() {
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

/*
 * Route-level suites: auth/permission middleware is stubbed so the shared
 * Supabase mock serves only route queries. Middleware enforcement itself is
 * covered by security-suite / edge-cases / dedicated middleware tests.
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
app.use("/api/v1/edu-automation", router);
app.use(errorHandler);

describe("Scorecards Gamification", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("GET /scorecards/summary", () => {
    it("returns aggregate data for an org", async () => {
      const s = mockSb();
      const scorecards = [
        { category: "Password Hygiene", score: 95, badge: "Gold" },
        { category: "Patch Compliance", score: 45, badge: "Needs Improvement" },
        { category: "Phishing Defense", score: 80, badge: "Silver" },
        { category: "Endpoint Protection", score: 70, badge: "Silver" },
        { category: "Access Control", score: 85, badge: "Silver" },
      ];
      s.from
        .mockReturnValueOnce(createMockBuilder({ data: scorecards, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: [], error: null }));

      const res = await request(app)
        .get("/api/v1/edu-automation/scorecards/summary")
        .set("Authorization", auth)
        .query({ organization_id: org });

      expect(res.status).toBe(200);
      expect(res.body.data.overallScore).toBe(75);
      expect(res.body.data.totalCategories).toBe(5);
      expect(res.body.data.badgesEarned).toContain("Gold");
      expect(res.body.data.badgesEarned).toContain("Silver");
      expect(res.body.data.badgesEarned).toContain("Needs Improvement");
      expect(res.body.data.topCategory).toEqual({
        category: "Password Hygiene",
        score: 95,
      });
      expect(res.body.data.lowestCategory).toEqual({
        category: "Patch Compliance",
        score: 45,
      });
    });

    it("returns empty state when no scorecards exist", async () => {
      const s = mockSb();
      s.from.mockReturnValue(createMockBuilder({ data: [], error: null }));

      const res = await request(app)
        .get("/api/v1/edu-automation/scorecards/summary")
        .set("Authorization", auth)
        .query({ organization_id: org });

      expect(res.status).toBe(200);
      expect(res.body.data.overallScore).toBe(0);
      expect(res.body.data.totalCategories).toBe(0);
      expect(res.body.data.badgesEarned).toEqual([]);
      expect(res.body.data.topCategory).toBeNull();
      expect(res.body.data.lowestCategory).toBeNull();
      expect(res.body.data.trend).toBe("stable");
    });

    it("returns empty summary when organization_id is missing", async () => {
      const s = mockSb();
      s.from.mockReturnValue(createMockBuilder({ data: [], error: null }));
      const res = await request(app)
        .get("/api/v1/edu-automation/scorecards/summary")
        .set("Authorization", auth);

      expect(res.status).toBe(200);
      expect(res.body.data.overallScore).toBe(0);
    });

    it("calculates trend from score history", async () => {
      const s = mockSb();
      const scorecards = [
        { category: "A", score: 80, badge: "Silver" },
        { category: "B", score: 70, badge: "Silver" },
      ];
      const history = [
        { score: 90, recorded_at: "2026-01-06" },
        { score: 85, recorded_at: "2026-01-05" },
        { score: 60, recorded_at: "2026-01-02" },
        { score: 55, recorded_at: "2026-01-01" },
      ];
      s.from
        .mockReturnValueOnce(createMockBuilder({ data: scorecards, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: history, error: null }));

      const res = await request(app)
        .get("/api/v1/edu-automation/scorecards/summary")
        .set("Authorization", auth)
        .query({ organization_id: org });

      expect(res.status).toBe(200);
      expect(res.body.data.trend).toBe("improving");
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .get("/api/v1/edu-automation/scorecards/summary")
        .query({ organization_id: org });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /scorecards/leaderboard", () => {
    it("returns top 10 organizations ranked by overall score", async () => {
      const s = mockSb();
      const scorecards = [
        {
          organization_id: "00000000-0000-0000-0000-000000000001",
          score: 90,
          organizations: { id: "00000000-0000-0000-0000-000000000001", name: "Alpha Corp" },
        },
        {
          organization_id: "org-2",
          score: 75,
          organizations: { id: "org-2", name: "Beta Inc" },
        },
        {
          organization_id: "00000000-0000-0000-0000-000000000001",
          score: 80,
          organizations: { id: "00000000-0000-0000-0000-000000000001", name: "Alpha Corp" },
        },
        {
          organization_id: "org-3",
          score: 60,
          organizations: { id: "org-3", name: "Gamma LLC" },
        },
      ];
      s.from.mockReturnValue(createMockBuilder({ data: scorecards, error: null }));

      const res = await request(app)
        .get("/api/v1/edu-automation/scorecards/leaderboard")
        .set("Authorization", auth);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data[0].organizationName).toBe("Alpha Corp");
      expect(res.body.data[0].overallScore).toBe(85);
      expect(res.body.data[0].totalCategories).toBe(2);
      expect(res.body.data[1].organizationName).toBe("Beta Inc");
      expect(res.body.data[2].organizationName).toBe("Gamma LLC");
    });

    it("returns empty leaderboard when no scorecards exist", async () => {
      const s = mockSb();
      s.from.mockReturnValue(createMockBuilder({ data: [], error: null }));

      const res = await request(app)
        .get("/api/v1/edu-automation/scorecards/leaderboard")
        .set("Authorization", auth);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe("POST /scorecards/evaluate", () => {
    it("assigns Gold badge for score >= 90", async () => {
      const s = mockSb();
      const scorecards = [{ id: "sc-1", category: "Password Hygiene", score: 95 }];
      // 1 select + 1 update + 1 score_history insert + 1 badges_earned insert + 1 Security Champion
      s.from
        .mockReturnValueOnce(createMockBuilder({ data: scorecards, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .post("/api/v1/edu-automation/scorecards/evaluate")
        .set("Authorization", auth)
        .send({ organization_id: org });

      expect(res.status).toBe(200);
      expect(res.body.data.evaluated).toBe(1);
      expect(res.body.data.badgesAssigned[0].badge).toBe("Gold");
      expect(res.body.data.badgesAssigned[0].points).toBe(100);
    });

    it("assigns Silver badge for score >= 70", async () => {
      const s = mockSb();
      const scorecards = [{ id: "sc-2", category: "Phishing", score: 75 }];
      s.from
        .mockReturnValueOnce(createMockBuilder({ data: scorecards, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .post("/api/v1/edu-automation/scorecards/evaluate")
        .set("Authorization", auth)
        .send({ organization_id: org });

      expect(res.status).toBe(200);
      expect(res.body.data.badgesAssigned[0].badge).toBe("Silver");
      expect(res.body.data.badgesAssigned[0].points).toBe(75);
    });

    it("assigns Bronze badge for score >= 50", async () => {
      const s = mockSb();
      const scorecards = [{ id: "sc-3", category: "Patching", score: 55 }];
      s.from
        .mockReturnValueOnce(createMockBuilder({ data: scorecards, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .post("/api/v1/edu-automation/scorecards/evaluate")
        .set("Authorization", auth)
        .send({ organization_id: org });

      expect(res.status).toBe(200);
      expect(res.body.data.badgesAssigned[0].badge).toBe("Bronze");
      expect(res.body.data.badgesAssigned[0].points).toBe(50);
    });

    it("assigns Needs Improvement badge for score < 50", async () => {
      const s = mockSb();
      const scorecards = [{ id: "sc-4", category: "Access Control", score: 30 }];
      s.from
        .mockReturnValueOnce(createMockBuilder({ data: scorecards, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .post("/api/v1/edu-automation/scorecards/evaluate")
        .set("Authorization", auth)
        .send({ organization_id: org });

      expect(res.status).toBe(200);
      expect(res.body.data.badgesAssigned[0].badge).toBe("Needs Improvement");
      expect(res.body.data.badgesAssigned[0].points).toBe(10);
    });

    it("awards Security Champion when overall avg >= 80", async () => {
      const s = mockSb();
      const scorecards = [
        { id: "sc-1", category: "A", score: 85 },
        { id: "sc-2", category: "B", score: 90 },
        { id: "sc-3", category: "C", score: 75 },
      ];
      // 1 select + 3*(update + score_history + badges_earned) + 1 Security Champion = 11
      s.from
        .mockReturnValueOnce(createMockBuilder({ data: scorecards, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .post("/api/v1/edu-automation/scorecards/evaluate")
        .set("Authorization", auth)
        .send({ organization_id: org });

      expect(res.status).toBe(200);
      expect(res.body.data.evaluated).toBe(3);
      const champion = res.body.data.badgesAssigned.find(
        (b: { badge: string }) => b.badge === "Security Champion",
      );
      expect(champion).toBeDefined();
      expect(champion.points).toBe(200);
      expect(champion.score).toBe(83);
    });

    it("records score history on evaluate", async () => {
      const s = mockSb();
      const scorecards = [{ id: "sc-1", category: "A", score: 80 }];
      s.from
        .mockReturnValueOnce(createMockBuilder({ data: scorecards, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }));

      await request(app)
        .post("/api/v1/edu-automation/scorecards/evaluate")
        .set("Authorization", auth)
        .send({ organization_id: org });

      expect(s.from).toHaveBeenCalledWith("score_history");
      expect(s.from.mock.calls).toEqual(
        expect.arrayContaining([expect.arrayContaining(["score_history"])]),
      );
    });

    it("returns 200 with 0 evaluated when no scorecards exist", async () => {
      const s = mockSb();
      s.from.mockReturnValue(createMockBuilder({ data: [], error: null }));

      const res = await request(app)
        .post("/api/v1/edu-automation/scorecards/evaluate")
        .set("Authorization", auth)
        .send({ organization_id: org });

      expect(res.status).toBe(200);
      expect(res.body.data.evaluated).toBe(0);
      expect(res.body.data.badgesAssigned).toEqual([]);
    });

    it("returns 400 when organization_id is missing (refuses cross-org evaluate)", async () => {
      const s = mockSb();
      s.from.mockReturnValue(createMockBuilder({ data: [], error: null }));
      const res = await request(app)
        .post("/api/v1/edu-automation/scorecards/evaluate")
        .set("Authorization", auth)
        .send({});

      expect(res.status).toBe(400);
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .post("/api/v1/edu-automation/scorecards/evaluate")
        .send({ organization_id: org });

      expect(res.status).toBe(401);
    });
  });
});
