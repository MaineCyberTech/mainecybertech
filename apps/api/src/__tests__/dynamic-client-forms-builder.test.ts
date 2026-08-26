import { jest } from "@jest/globals";
import request from "supertest";
import dynamicFormsRouter from "../routes/dynamic-client-forms-builder";
import { createTestApp, createMockBuilder, type MockResult , tableAwareFrom } from "./helpers";
import { invalidateCache } from "../middleware/cache";
import { errorHandler } from "../middleware/error";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";

const app = createTestApp();
app.use("/api/v1/dynamic-forms", dynamicFormsRouter);
app.use(errorHandler);

function mockSupabase() {
  const mock: {
    from: jest.Mock;
    auth: { getUser: jest.Mock };
  } = {
    from: jest.fn(),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);
  return mock;
}

function mockFrom(result: MockResult) {
  const mock = mockSupabase();
  const builder = createMockBuilder(result);
  mock.from.mockImplementation(tableAwareFrom(builder));
  return { mock, builder };
}

const FORM_RECORD = {
  id: "00000000-0000-0000-0000-000000000130",
  organization_id: "00000000-0000-0000-0000-000000000001",
  title: "Client Intake Form",
  description: "New client intake",
  form_type: "intake",
  status: "draft",
  fields: [
    {
      key: "name",
      label: "Full Name",
      type: "text",
      required: true,
      placeholder: null,
      options: [],
      helpText: null,
      validation: {},
      sortOrder: 0,
    },
    {
      key: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: null,
      options: [],
      helpText: null,
      validation: {},
      sortOrder: 1,
    },
  ],
  settings: {},
  published_at: null,
  closes_at: null,
  created_by: "user-1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const SUBMISSION_RECORD = {
  id: "sub-1",
  form_id: "00000000-0000-0000-0000-000000000130",
  organization_id: "00000000-0000-0000-0000-000000000001",
  respondent_id: null,
  respondent_email: "client@test.com",
  answers: { name: "John Doe", email: "john@test.com" },
  status: "submitted",
  submitted_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("Dynamic Client Forms Builder API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCache();
  });

  describe("GET /api/v1/dynamic-forms", () => {
    it("requires auth", async () => {
      const res = await request(app).get("/api/v1/dynamic-forms");
      expect(res.status).toBe(401);
    });

    it("returns paginated forms", async () => {
      mockFrom({ data: [FORM_RECORD], error: null, count: 1 });
      const res = await request(app)
        .get("/api/v1/dynamic-forms")
        .set("Authorization", "Bearer test-token")
        .query({ organizationId: "00000000-0000-0000-0000-000000000001" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("GET /api/v1/dynamic-forms/:id", () => {
    it("requires auth", async () => {
      const res = await request(app).get("/api/v1/dynamic-forms/form-1");
      expect(res.status).toBe(401);
    });

    it("returns a form by id", async () => {
      mockFrom({ data: FORM_RECORD, error: null });
      const res = await request(app)
        .get("/api/v1/dynamic-forms/form-1")
        .set("Authorization", "Bearer test-token")
        .query({ organizationId: "00000000-0000-0000-0000-000000000001" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("POST /api/v1/dynamic-forms", () => {
    it("requires auth", async () => {
      const res = await request(app)
        .post("/api/v1/dynamic-forms")
        .send({ organizationId: "00000000-0000-0000-0000-000000000001", title: "Test" });
      expect(res.status).toBe(401);
    });

    it("validates required fields", async () => {
      const res = await request(app)
        .post("/api/v1/dynamic-forms")
        .set("Authorization", "Bearer test-token")
        .send({ organizationId: "00000000-0000-0000-0000-000000000001" });
      expect(res.status).toBe(400);
    });

    it("creates a form", async () => {
      mockFrom({ data: FORM_RECORD, error: null });
      const res = await request(app)
        .post("/api/v1/dynamic-forms")
        .set("Authorization", "Bearer test-token")
        .send({
          organizationId: "00000000-0000-0000-0000-000000000001",
          title: "Client Intake Form",
          formType: "intake",
          fields: [{ key: "name", label: "Full Name", type: "text", required: true }],
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(logAuditEvent).toHaveBeenCalled();
    });
  });

  describe("PATCH /api/v1/dynamic-forms/:id", () => {
    it("requires auth", async () => {
      const res = await request(app)
        .patch("/api/v1/dynamic-forms/form-1")
        .send({ title: "Updated" });
      expect(res.status).toBe(401);
    });

    it("updates a form", async () => {
      mockFrom({ data: { ...FORM_RECORD, title: "Updated Form" }, error: null });
      const res = await request(app)
        .patch("/api/v1/dynamic-forms/form-1")
        .set("Authorization", "Bearer test-token")
        .send({ title: "Updated Form" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(logAuditEvent).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/v1/dynamic-forms/:id", () => {
    it("requires auth", async () => {
      const res = await request(app).delete("/api/v1/dynamic-forms/form-1");
      expect(res.status).toBe(401);
    });

    it("deletes a form", async () => {
      mockFrom({ data: null, error: null });
      const res = await request(app)
        .delete("/api/v1/dynamic-forms/form-1")
        .set("Authorization", "Bearer test-token")
        .query({ organizationId: "00000000-0000-0000-0000-000000000001" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(logAuditEvent).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/dynamic-forms/:id/publish", () => {
    it("requires auth", async () => {
      const res = await request(app).post("/api/v1/dynamic-forms/form-1/publish").send({});
      expect(res.status).toBe(401);
    });

    it("publishes a draft form", async () => {
      mockFrom({
        data: { ...FORM_RECORD, status: "published", published_at: "2026-01-01T00:00:00Z" },
        error: null,
      });
      const res = await request(app)
        .post("/api/v1/dynamic-forms/form-1/publish")
        .set("Authorization", "Bearer test-token")
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(logAuditEvent).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/dynamic-forms/:id/submit", () => {
    it("requires auth", async () => {
      const res = await request(app)
        .post("/api/v1/dynamic-forms/form-1/submit")
        .send({ answers: {} });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/dynamic-forms/:id/submissions", () => {
    it("requires auth", async () => {
      const res = await request(app).get("/api/v1/dynamic-forms/form-1/submissions");
      expect(res.status).toBe(401);
    });

    it("lists submissions for a form", async () => {
      mockFrom({ data: [SUBMISSION_RECORD], error: null, count: 1 });
      const res = await request(app)
        .get("/api/v1/dynamic-forms/form-1/submissions")
        .set("Authorization", "Bearer test-token")
        .query({ organizationId: "00000000-0000-0000-0000-000000000001" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("GET /api/v1/dynamic-forms/export.csv", () => {
    it("requires auth", async () => {
      const res = await request(app)
        .get("/api/v1/dynamic-forms/export.csv")
        .query({ organizationId: "00000000-0000-0000-0000-000000000001" });
      expect(res.status).toBe(401);
    });

    it("exports forms", async () => {
      mockFrom({ data: [FORM_RECORD], error: null });
      const res = await request(app)
        .get("/api/v1/dynamic-forms/export.csv")
        .set("Authorization", "Bearer test-token")
        .query({ organizationId: "00000000-0000-0000-0000-000000000001", format: "csv" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(logAuditEvent).toHaveBeenCalled();
    });
  });
});
