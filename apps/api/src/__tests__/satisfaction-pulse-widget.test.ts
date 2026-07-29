import { jest } from "@jest/globals";
import request from "supertest";
import satisfactionPulseRouter from "../routes/satisfaction-pulse-widget";
import { createTestApp, createMockBuilder, type MockResult } from "./helpers";
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
app.use("/api/v1/satisfaction-pulse", satisfactionPulseRouter);
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
  mock.from.mockReturnValue(builder);
  return { mock, builder };
}

const PULSE = {
  id: "00000000-0000-0000-0000-000000000140",
  organization_id: "00000000-0000-0000-0000-000000000001",
  subject: "Test Pulse",
  question: "How satisfied are you?",
  rating: 5,
  feedback: "Great service!",
  source: "ticket",
  source_entity_id: "00000000-0000-0000-0000-000000000010",
  template_id: null,
  status: "pending",
  sent_at: null,
  responded_at: null,
  send_at: null,
  scheduled_for: null,
  created_by: "user-1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const TEMPLATE = {
  id: "template-1",
  organization_id: "00000000-0000-0000-0000-000000000001",
  name: "Test Template",
  subject: "Test Subject",
  question: "Test question",
  default_rating: 5,
  is_active: true,
  created_by: "user-1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const SCHEDULE = {
  id: "schedule-1",
  organization_id: "00000000-0000-0000-0000-000000000001",
  template_id: "template-1",
  name: "Test Schedule",
  trigger_type: "ticket_closed",
  trigger_config: {},
  frequency: "weekly",
  cron_expression: null,
  is_active: true,
  last_run_at: null,
  next_run_at: "2026-01-08T00:00:00Z",
  created_by: "user-1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("satisfaction-pulse-widget routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCache();
  });

  describe("GET /", () => {
    it("returns a paginated list of satisfaction pulses", async () => {
      const result: MockResult = { data: [PULSE], error: null, count: 1 };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/satisfaction-pulse")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });

    it("returns empty list when no pulses", async () => {
      const result: MockResult = { data: [], error: null, count: 0 };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/satisfaction-pulse")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(0);
      expect(res.body.data.total).toBe(0);
    });

    it("filters by status", async () => {
      const result: MockResult = { data: [PULSE], error: null, count: 1 };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/satisfaction-pulse?status=responded")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });

    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/v1/satisfaction-pulse");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /:id", () => {
    it("returns a single satisfaction pulse", async () => {
      const result: MockResult = { data: PULSE, error: null };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/satisfaction-pulse/pulse-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subject).toBe("Test Pulse");
    });

    it("returns 404 when pulse not found", async () => {
      const result: MockResult = { data: null, error: { code: "PGRST116" } };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/satisfaction-pulse/nonexistent")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    it("creates a satisfaction pulse", async () => {
      const newPulse = { ...PULSE, id: "new-pulse-1", subject: "New Pulse" };
      const result: MockResult = { data: newPulse, error: null };
      mockFrom(result);

      const res = await request(app)
        .post("/api/v1/satisfaction-pulse")
        .set("Authorization", "Bearer token-123")
        .send({
          organizationId: "00000000-0000-0000-0000-000000000001",
          subject: "New Pulse",
          question: "Test question",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subject).toBe("New Pulse");
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "satisfaction_pulse.created" }),
      );
    });

    it("returns 400 when subject is missing", async () => {
      mockFrom({ data: null, error: null });

      const res = await request(app)
        .post("/api/v1/satisfaction-pulse")
        .set("Authorization", "Bearer token-123")
        .send({ organizationId: "00000000-0000-0000-0000-000000000001" });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /:id", () => {
    it("updates a satisfaction pulse", async () => {
      const currentPulse = { ...PULSE };
      const updatedPulse = { ...PULSE, subject: "Updated Pulse" };

      const mock = mockSupabase();
      mock.from
        .mockReturnValueOnce(createMockBuilder({ data: currentPulse, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: updatedPulse, error: null }));

      const res = await request(app)
        .patch("/api/v1/satisfaction-pulse/pulse-1")
        .set("Authorization", "Bearer token-123")
        .send({ subject: "Updated Pulse" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subject).toBe("Updated Pulse");
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "satisfaction_pulse.updated" }),
      );
    });
  });

  describe("POST /:id/respond", () => {
    it("responds to a satisfaction pulse", async () => {
      const currentPulse = { ...PULSE, status: "pending" };
      const respondedPulse = { ...PULSE, status: "responded", rating: 8, feedback: "Good!" };

      const mock = mockSupabase();
      mock.from
        .mockReturnValueOnce(createMockBuilder({ data: currentPulse, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: respondedPulse, error: null }));

      const res = await request(app)
        .post("/api/v1/satisfaction-pulse/pulse-1/respond")
        .set("Authorization", "Bearer token-123")
        .send({
          organizationId: "00000000-0000-0000-0000-000000000001",
          rating: 8,
          feedback: "Good!",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("responded");
      expect(res.body.data.rating).toBe(8);
    });
  });

  describe("DELETE /:id", () => {
    it("deletes a satisfaction pulse", async () => {
      const currentPulse = { ...PULSE };
      const mock = mockSupabase();
      mock.from
        .mockReturnValueOnce(createMockBuilder({ data: currentPulse, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .delete("/api/v1/satisfaction-pulse/pulse-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "satisfaction_pulse.deleted" }),
      );
    });
  });

  describe("GET /export", () => {
    it("exports satisfaction pulses as CSV", async () => {
      const result: MockResult = { data: [PULSE], error: null };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/satisfaction-pulse/export?format=csv")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("Test Pulse");
    });

    it("exports satisfaction pulses as JSON", async () => {
      const result: MockResult = { data: [PULSE], error: null };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/satisfaction-pulse/export?format=json")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("GET /templates", () => {
    it("returns a list of templates", async () => {
      const result: MockResult = { data: [TEMPLATE], error: null };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/satisfaction-pulse/templates")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("POST /templates", () => {
    it("creates a template", async () => {
      const newTemplate = { ...TEMPLATE, id: "new-template-1", name: "New Template" };
      const result: MockResult = { data: newTemplate, error: null };
      mockFrom(result);

      const res = await request(app)
        .post("/api/v1/satisfaction-pulse/templates")
        .set("Authorization", "Bearer token-123")
        .send({
          organizationId: "00000000-0000-0000-0000-000000000001",
          name: "New Template",
          subject: "Test Subject",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("New Template");
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "satisfaction_pulse_template.created" }),
      );
    });
  });

  describe("GET /schedules", () => {
    it("returns a list of schedules", async () => {
      const result: MockResult = { data: [SCHEDULE], error: null };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/satisfaction-pulse/schedules")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("POST /schedules", () => {
    it("creates a schedule", async () => {
      const newSchedule = { ...SCHEDULE, id: "new-schedule-1", name: "New Schedule" };
      const result: MockResult = { data: newSchedule, error: null };
      mockFrom(result);

      const res = await request(app)
        .post("/api/v1/satisfaction-pulse/schedules")
        .set("Authorization", "Bearer token-123")
        .send({
          organizationId: "00000000-0000-0000-0000-000000000001",
          name: "New Schedule",
          triggerType: "ticket_closed",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("New Schedule");
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "satisfaction_pulse_schedule.created" }),
      );
    });
  });
});
