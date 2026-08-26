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
jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn() }));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";
import trainingHubRouter from "../routes/training-hub";

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
jest.mock("../middleware/require-active-subscription", () => ({
  requireActiveSubscription: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const app = createTestApp();
app.use("/api/v1/training-hub", trainingHubRouter);
app.use(errorHandler);

describe("Training Hub API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists courses (empty)", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const res = await request(app)
      .get("/api/v1/training-hub/courses")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });

  it("creates a course", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "c-1",
          title: "Phishing Awareness",
          status: "draft",
          organization_id: testOrgId,
        },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/training-hub/courses")
      .set("Authorization", authToken)
      .send({ organizationId: testOrgId, title: "Phishing Awareness", category: "security" });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("Phishing Awareness");
  });

  it("gets a course by id", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: "c-1", title: "Security 101", status: "published", organization_id: testOrgId },
        error: null,
      }),
    );
    const res = await request(app)
      .get("/api/v1/training-hub/courses/c-1")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Security 101");
  });

  it("returns 404 for non-existent course", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
    const res = await request(app)
      .get("/api/v1/training-hub/courses/no-id")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("updates a course", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: "c-1", title: "Phishing v2", status: "published", organization_id: testOrgId },
        error: null,
      }),
    );
    const res = await request(app)
      .patch("/api/v1/training-hub/courses/c-1")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken)
      .send({ title: "Phishing v2", status: "published" });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Phishing v2");
  });

  it("deletes a course", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ error: null }));
    const res = await request(app)
      .delete("/api/v1/training-hub/courses/c-1")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken);
    expect(res.status).toBe(204);
  });

  it("lists lessons by course", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));
    const res = await request(app)
      .get("/api/v1/training-hub/lessons")
      .query({ course_id: "c-1" })
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("creates a lesson", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: "l-1", title: "Module 1", course_id: "c-1", sort_order: 0 },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/training-hub/lessons")
      .set("Authorization", authToken)
      .send({ courseId: "c-1", title: "Module 1", lessonType: "text" });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("Module 1");
  });

  it("enrolls in a course", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "e-1",
          course_id: "c-1",
          user_id: "user-1",
          status: "enrolled",
          progress_percent: 0,
        },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/training-hub/courses/c-1/enroll")
      .set("Authorization", authToken)
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("enrolled");
  });

  it("updates progress", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "e-1",
          course_id: "c-1",
          user_id: "user-1",
          progress_percent: 50,
          status: "in_progress",
        },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/training-hub/courses/c-1/progress")
      .set("Authorization", authToken)
      .send({ progress: 50 });
    expect(res.status).toBe(200);
    expect(res.body.data.progress_percent).toBe(50);
  });

  it("returns my-courses", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: [
          {
            id: "e-1",
            course_id: "c-1",
            user_id: "user-1",
            status: "enrolled",
            training_courses: { id: "c-1", title: "Security 101" },
          },
        ],
        error: null,
      }),
    );
    const res = await request(app)
      .get("/api/v1/training-hub/my-courses")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/v1/training-hub/courses");
    expect(res.status).toBe(401);
  });

  it("returns 400 when creating a course without a title", async () => {
    mockAuth();
    const res = await request(app)
      .post("/api/v1/training-hub/courses")
      .set("Authorization", authToken)
      .send({ organizationId: testOrgId });
    expect(res.status).toBe(400);
  });

  it("returns 400 when progress is out of range", async () => {
    mockAuth();
    const res = await request(app)
      .post("/api/v1/training-hub/courses/c-1/progress")
      .set("Authorization", authToken)
      .send({ progress: 150 });
    expect(res.status).toBe(400);
  });
});
