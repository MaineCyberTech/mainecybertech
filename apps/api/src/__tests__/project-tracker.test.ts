import { jest } from "@jest/globals";
import request from "supertest";
import projectsRouter from "../routes/projects";
import { createTestApp, createMockBuilder } from "./helpers";
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

function mockAuth() {
  const supabase = {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
    rpc: jest.fn(),
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@example.com" } },
    error: null,
  });
  return supabase;
}

const PHASE = {
  id: "phase-1",
  project_id: "proj-1",
  name: "Phase 1",
  status: "planned",
  sort_order: 0,
};

const MILESTONE = {
  id: "ms-1",
  project_id: "proj-1",
  title: "Milestone 1",
  status: "pending",
};

const DEPENDENCY = {
  id: "dep-1",
  project_id: "proj-1",
  dependency_type: "finish_to_start",
};

const app = createTestApp();
app.use("/api/v1/projects", projectsRouter);
app.use(errorHandler);

describe("project tracker routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCache();
  });

  describe("GET /phases", () => {
    it("returns phases for a project", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: [PHASE], error: null, count: 1 }),
      );

      const res = await request(app)
        .get("/api/v1/projects/phases?project_id=proj-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });

    it("returns 400 when project_id is missing", async () => {
      mockAuth();

      const res = await request(app)
        .get("/api/v1/projects/phases")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(400);
    });
  });

  describe("POST /phases", () => {
    it("creates a phase", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: PHASE, error: null }),
      );

      const res = await request(app)
        .post("/api/v1/projects/phases")
        .set("Authorization", "Bearer token-123")
        .send({
          projectId: "proj-1",
          name: "Phase 1",
          status: "planned",
          sortOrder: 0,
        });

      expect(res.status).toBe(201);
    });
  });

  describe("PATCH /phases/:id", () => {
    it("updates a phase", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: PHASE, error: null }),
      );

      const res = await request(app)
        .patch("/api/v1/projects/phases/phase-1")
        .set("Authorization", "Bearer token-123")
        .send({ name: "Updated Phase" });

      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /phases/:id", () => {
    it("deletes a phase", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: null, error: null }),
      );

      const res = await request(app)
        .delete("/api/v1/projects/phases/phase-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(204);
    });
  });

  describe("GET /milestones", () => {
    it("returns milestones for a project", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: [MILESTONE], error: null, count: 1 }),
      );

      const res = await request(app)
        .get("/api/v1/projects/milestones?project_id=proj-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
    });

    it("returns 400 when project_id is missing for milestones", async () => {
      mockAuth();

      const res = await request(app)
        .get("/api/v1/projects/milestones")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(400);
    });
  });

  describe("POST /milestones", () => {
    it("creates a milestone", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: MILESTONE, error: null }),
      );

      const res = await request(app)
        .post("/api/v1/projects/milestones")
        .set("Authorization", "Bearer token-123")
        .send({
          projectId: "proj-1",
          title: "Milestone 1",
          status: "pending",
        });

      expect(res.status).toBe(201);
    });
  });

  describe("GET /dependencies", () => {
    it("returns dependencies for a project", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: [DEPENDENCY], error: null, count: 1 }),
      );

      const res = await request(app)
        .get("/api/v1/projects/dependencies?project_id=proj-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
    });

    it("returns 400 when project_id is missing for dependencies", async () => {
      mockAuth();

      const res = await request(app)
        .get("/api/v1/projects/dependencies")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(400);
    });
  });

  describe("POST /dependencies", () => {
    it("creates a dependency", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: DEPENDENCY, error: null }),
      );

      const res = await request(app)
        .post("/api/v1/projects/dependencies")
        .set("Authorization", "Bearer token-123")
        .send({
          projectId: "proj-1",
          dependencyType: "finish_to_start",
        });

      expect(res.status).toBe(201);
    });
  });

  describe("PATCH /milestones/:id", () => {
    it("updates a milestone", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: MILESTONE, error: null }),
      );

      const res = await request(app)
        .patch("/api/v1/projects/milestones/ms-1")
        .set("Authorization", "Bearer token-123")
        .send({ status: "completed" });

      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /milestones/:id", () => {
    it("deletes a milestone", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: null, error: null }),
      );

      const res = await request(app)
        .delete("/api/v1/projects/milestones/ms-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(204);
    });
  });

  describe("auth required", () => {
    it("returns 401 when no auth token is provided", async () => {
      const res = await request(app).get("/api/v1/projects/phases?project_id=proj-1");

      expect(res.status).toBe(401);
    });
  });
});
