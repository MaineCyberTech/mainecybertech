import { jest } from "@jest/globals";
import request from "supertest";
import clientOnboardingRouter from "../routes/client-onboarding-command-center";
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
app.use("/api/v1/client-onboarding", clientOnboardingRouter);
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

const ONBOARDING_RECORD = {
  id: "onboard-1",
  organization_id: "org-1",
  client_name: "Test Client",
  client_domain: "test.com",
  client_contact_email: "contact@test.com",
  client_contact_phone: "555-1234",
  onboarding_lead_id: "user-1",
  status: "discovery",
  phase: "discovery",
  risk_level: "medium",
  discovery_notes: "Initial discovery notes",
  m365_setup_status: "not_started",
  m365_tenant_id: null,
  m365_licenses: {},
  access_collection_status: "not_started",
  access_credentials: {},
  network_baseline_status: "not_started",
  network_diagram_url: null,
  network_scan_results: {},
  documentation_status: "not_started",
  documentation_url: null,
  security_baseline_status: "not_started",
  security_baseline_score: null,
  security_findings: [],
  support_handoff_status: "not_started",
  support_handoff_notes: null,
  handoff_completed_at: null,
  next_review_at: null,
  started_at: "2026-01-01T00:00:00Z",
  completed_at: null,
  version: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const CHECKLIST_ITEM = {
  id: "item-1",
  organization_id: "org-1",
  onboarding_record_id: "onboard-1",
  phase: "discovery",
  item_key: "initial_meeting",
  label: "Initial Kickoff Meeting",
  description: "Schedule and conduct initial discovery meeting with client stakeholders",
  is_required: true,
  is_completed: false,
  completed_by: null,
  completed_at: null,
  notes: null,
  sort_order: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("client-onboarding-command-center routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCache();
  });

  describe("GET /", () => {
    it("returns a paginated list of onboarding records", async () => {
      const result: MockResult = { data: [ONBOARDING_RECORD], error: null, count: 1 };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/client-onboarding")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });

    it("returns empty list when no records", async () => {
      const result: MockResult = { data: [], error: null, count: 0 };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/client-onboarding")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(0);
      expect(res.body.data.total).toBe(0);
    });

    it("filters by status", async () => {
      const result: MockResult = { data: [ONBOARDING_RECORD], error: null, count: 1 };
      const { mock } = mockFrom(result);

      const res = await request(app)
        .get("/api/v1/client-onboarding?status=discovery")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(mock.from).toHaveBeenCalledWith("client_onboarding_command_center_records");
    });

    it("filters by phase", async () => {
      const result: MockResult = { data: [ONBOARDING_RECORD], error: null, count: 1 };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/client-onboarding?phase=m365_setup")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });

    it("filters by risk level", async () => {
      const result: MockResult = { data: [ONBOARDING_RECORD], error: null, count: 1 };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/client-onboarding?riskLevel=high")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });

    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/v1/client-onboarding");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /:id", () => {
    it("returns a single onboarding record", async () => {
      const result: MockResult = { data: ONBOARDING_RECORD, error: null };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/client-onboarding/onboard-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.client_name).toBe("Test Client");
    });

    it("returns 404 when record not found", async () => {
      const result: MockResult = { data: null, error: { code: "PGRST116" } };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/client-onboarding/nonexistent")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    it("creates an onboarding record", async () => {
      const newRecord = { ...ONBOARDING_RECORD, id: "new-onboard-1", client_name: "New Client" };
      const result: MockResult = { data: newRecord, error: null };
      mockFrom(result);

      const res = await request(app)
        .post("/api/v1/client-onboarding")
        .set("Authorization", "Bearer token-123")
        .send({
          organizationId: "org-1",
          clientName: "New Client",
          clientDomain: "newclient.com",
          clientContactEmail: "new@client.com",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.client_name).toBe("New Client");
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "client_onboarding.create" }),
      );
    });

    it("returns 400 when clientName is missing", async () => {
      mockFrom({ data: null, error: null });

      const res = await request(app)
        .post("/api/v1/client-onboarding")
        .set("Authorization", "Bearer token-123")
        .send({ clientDomain: "test.com" });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /:id", () => {
    it("updates an onboarding record", async () => {
      const currentRecord = { ...ONBOARDING_RECORD };
      const updatedRecord = { ...ONBOARDING_RECORD, client_name: "Updated Client", version: 2 };

      const mock = mockSupabase();
      mock.from
        .mockReturnValueOnce(createMockBuilder({ data: currentRecord, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: updatedRecord, error: null }));

      const res = await request(app)
        .patch("/api/v1/client-onboarding/onboard-1")
        .set("Authorization", "Bearer token-123")
        .send({ clientName: "Updated Client" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.client_name).toBe("Updated Client");
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "client_onboarding.update" }),
      );
    });
  });

  describe("DELETE /:id", () => {
    it("deletes an onboarding record", async () => {
      const currentRecord = { ...ONBOARDING_RECORD };
      const mock = mockSupabase();
      mock.from
        .mockReturnValueOnce(createMockBuilder({ data: currentRecord, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .delete("/api/v1/client-onboarding/onboard-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "client_onboarding.delete" }),
      );
    });
  });

  describe("POST /:id/complete-phase", () => {
    it("completes a phase and advances to next", async () => {
      const currentRecord = { ...ONBOARDING_RECORD, phase: "discovery", status: "discovery" };
      const updatedRecord = { ...currentRecord, phase: "m365_setup", status: "m365_setup" };

      const mock = mockSupabase();
      mock.from
        .mockReturnValueOnce(createMockBuilder({ data: { phase: "discovery" }, error: null })) // route's phase check
        .mockReturnValueOnce(createMockBuilder({ data: currentRecord, error: null })) // service's get current
        .mockReturnValueOnce(createMockBuilder({ data: updatedRecord, error: null })) // service's update
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null })); // service's checklist update

      const res = await request(app)
        .post("/api/v1/client-onboarding/onboard-1/complete-phase")
        .query({ organization_id: "org-1" })
        .set("Authorization", "Bearer token-123")
        .send({ completedBy: "user-1" });

      if (res.status !== 200) {
        console.log("Response status:", res.status);
        console.log("Response body:", res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("GET /:id/checklist", () => {
    it("returns checklist items for onboarding record", async () => {
      const result: MockResult = { data: [CHECKLIST_ITEM], error: null };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/client-onboarding/onboard-1/checklist")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("PATCH /:id/checklist/:itemId", () => {
    it("updates checklist item completion status", async () => {
      const currentItem = { ...CHECKLIST_ITEM };
      const updatedItem = {
        ...CHECKLIST_ITEM,
        is_completed: true,
        completed_by: "user-1",
        completed_at: "2026-01-02T00:00:00Z",
      };

      const mock = mockSupabase();
      mock.from
        .mockReturnValueOnce(createMockBuilder({ data: currentItem, error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: updatedItem, error: null }));

      const res = await request(app)
        .patch("/api/v1/client-onboarding/onboard-1/checklist/item-1")
        .set("Authorization", "Bearer token-123")
        .send({ isCompleted: true, completedBy: "user-1" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_completed).toBe(true);
    });
  });

  describe("GET /export.csv", () => {
    it("exports onboarding records as CSV", async () => {
      const result: MockResult = { data: [ONBOARDING_RECORD], error: null };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/client-onboarding/export.csv?format=csv")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("Test Client");
    });

    it("exports onboarding records as JSON", async () => {
      const result: MockResult = { data: [ONBOARDING_RECORD], error: null };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/client-onboarding/export.csv?format=json")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });
});
