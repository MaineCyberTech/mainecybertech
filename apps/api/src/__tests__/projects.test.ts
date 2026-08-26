import { jest } from "@jest/globals";
import request from "supertest";
import projectsRouter from "../routes/projects";
import { createTestApp, createMockBuilder, type MockResult  } from "./helpers";
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
    data: { user: { id: "00000000-0000-0000-0000-000000000777", email: "test@example.com" } },
    error: null,
  });
  return supabase;
}

const PROJECT = {
  id: "00000000-0000-0000-0000-000000000030",
  name: "Test Project",
  status: "active",
  organization_id: "00000000-0000-0000-0000-000000000001",
};
const TASK = {
  id: "00000000-0000-0000-0000-000000000031",
  project_id: "00000000-0000-0000-0000-000000000030",
  title: "Test Task",
  status: "todo",
  sort_order: 1,
};
const COMMENT = {
  id: "00000000-0000-0000-0000-000000000041",
  task_id: "00000000-0000-0000-0000-000000000031",
  body: "Test",
  is_internal: false,
};
const UPDATE = {
  id: "00000000-0000-0000-0000-000000000042",
  project_id: "00000000-0000-0000-0000-000000000030",
  body: "Update content",
};
const READ_STATE = {
  id: "00000000-0000-0000-0000-000000000043",
  user_id: "user-1",
  task_id: "00000000-0000-0000-0000-000000000031",
};

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
jest.mock("../middleware/require-active-subscription", () => ({
  requireActiveSubscription: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const app = createTestApp();
app.use("/api/v1/projects", projectsRouter);
app.use(errorHandler);

describe("projects routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCache();
  });

  describe("GET /", () => {
    it("returns paginated projects", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: [PROJECT], error: null, count: 1 }),
      );

      const res = await request(app)
        .get("/api/v1/projects")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
    });

    it("filters by organization_id", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: [], error: null, count: 0 }),
      );

      const res = await request(app)
        .get("/api/v1/projects?organization_id=00000000-0000-0000-0000-000000000001")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /compound", () => {
    it("returns projects with tasks, comments, and read states in one call", async () => {
      const supabase = mockAuth();
      supabase.from
        .mockReturnValueOnce(createMockBuilder({ data: [PROJECT], error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: [TASK], error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: [COMMENT], error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: [READ_STATE], error: null }));

      const res = await request(app)
        .get("/api/v1/projects/compound?organization_id=00000000-0000-0000-0000-000000000001")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.projects).toHaveLength(1);
      expect(res.body.data.tasks).toHaveLength(1);
      expect(res.body.data.comments).toHaveLength(1);
      expect(res.body.data.reads).toHaveLength(1);
    });

    it("handles orgs with no projects", async () => {
      const supabase = mockAuth();
      supabase.from
        .mockReturnValueOnce(createMockBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createMockBuilder({ data: [], error: null }));

      const res = await request(app)
        .get("/api/v1/projects/compound?organization_id=00000000-0000-0000-0000-000000000001")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.projects).toHaveLength(0);
    });
  });

  describe("GET /:id", () => {
    it("returns a project with tasks", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: PROJECT, error: null }),
      );

      const res = await request(app)
        .get("/api/v1/projects/00000000-0000-0000-0000-000000000030")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });

    it("returns 404 when not found", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: null, error: new Error("Not found") }),
      );

      const res = await request(app)
        .get("/api/v1/projects/00000000-0000-0000-0000-000000000999")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    it("creates a project", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: PROJECT, error: null }),
      );

      const res = await request(app)
        .post("/api/v1/projects")
        .set("Authorization", "Bearer token-123")
        .send({
          organizationId: "00000000-0000-0000-0000-000000000001",
          name: "Test Project",
          status: "active",
          priority: "normal",
        });

      expect(res.status).toBe(201);
    });
  });

  describe("PATCH /:id", () => {
    it("updates a project", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: PROJECT, error: null }),
      );

      const res = await request(app)
        .patch("/api/v1/projects/00000000-0000-0000-0000-000000000030")
        .set("Authorization", "Bearer token-123")
        .send({ name: "Updated" });

      expect(res.status).toBe(200);
    });

    it("returns 404 when not found", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: null, error: null }),
      );

      const res = await request(app)
        .patch("/api/v1/projects/00000000-0000-0000-0000-000000000999")
        .set("Authorization", "Bearer token-123")
        .send({ name: "Updated" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /:id", () => {
    it("deletes a project", async () => {
      const supabase = mockAuth();
      supabase.from
        .mockReturnValueOnce(
          createMockBuilder({
            data: [{ roles: { id: "role-1", key: "admin" } }],
            error: null,
          }),
        )
        .mockReturnValueOnce(
          createMockBuilder({
            data: { id: "proj-1", organization_id: "org-1" },
            error: null,
          }),
        )
        .mockReturnValue(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .delete("/api/v1/projects/00000000-0000-0000-0000-000000000030")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(204);
    });
  });

  describe("GET /:id/tasks", () => {
    it("returns tasks for a project", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: [TASK], error: null }),
      );

      const res = await request(app)
        .get("/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("POST /:id/tasks", () => {
    it("creates a task", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: TASK, error: null }),
      );

      const res = await request(app)
        .post("/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks")
        .set("Authorization", "Bearer token-123")
        .send({
          title: "New Task",
          status: "todo",
          sortOrder: 1,
          approvalRequired: false,
        });

      expect(res.status).toBe(201);
    });
  });

  describe("PATCH /:id/tasks/:taskId", () => {
    it("updates a task", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: TASK, error: null }),
      );

      const res = await request(app)
        .patch(
          "/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/00000000-0000-0000-0000-000000000031",
        )
        .set("Authorization", "Bearer token-123")
        .send({ title: "Updated Task" });

      expect(res.status).toBe(200);
    });

    it("returns 404 when task not found", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: null, error: null }),
      );

      const res = await request(app)
        .patch(
          "/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/00000000-0000-0000-0000-000000000999",
        )
        .set("Authorization", "Bearer token-123")
        .send({ title: "Updated" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /:id/tasks/:taskId", () => {
    it("deletes a task", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: null, error: null }),
      );

      const res = await request(app)
        .delete(
          "/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/00000000-0000-0000-0000-000000000031",
        )
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(204);
    });
  });

  describe("GET /:id/tasks/comments", () => {
    it("returns task comments with filters", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: [COMMENT], error: null }),
      );

      const res = await request(app)
        .get("/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/comments")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });

    it("filters by organization_id", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: [], error: null }),
      );

      const res = await request(app)
        .get(
          "/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/comments?organization_id=00000000-0000-0000-0000-000000000001",
        )
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });
  });

  describe("POST /:id/tasks/:taskId/comments", () => {
    it("adds a task comment", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: COMMENT, error: null }),
      );

      const res = await request(app)
        .post(
          "/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/00000000-0000-0000-0000-000000000031/comments",
        )
        .set("Authorization", "Bearer token-123")
        .send({ body: "New comment", isInternal: false });

      expect(res.status).toBe(201);
    });
  });

  describe("GET /:id/updates", () => {
    it("returns project updates", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: [UPDATE], error: null }),
      );

      const res = await request(app)
        .get("/api/v1/projects/00000000-0000-0000-0000-000000000030/updates")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });
  });

  describe("POST /:id/updates", () => {
    it("creates a project update", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: UPDATE, error: null }),
      );

      const res = await request(app)
        .post("/api/v1/projects/00000000-0000-0000-0000-000000000030/updates")
        .set("Authorization", "Bearer token-123")
        .send({ body: "Update", isInternal: false, isPinned: false });

      expect(res.status).toBe(201);
    });
  });

  describe("PATCH /:id/updates/:updateId", () => {
    it("updates a project update", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: UPDATE, error: null }),
      );

      const res = await request(app)
        .patch("/api/v1/projects/00000000-0000-0000-0000-000000000030/updates/upd-1")
        .set("Authorization", "Bearer token-123")
        .send({ body: "Updated content" });

      expect(res.status).toBe(200);
    });

    it("returns 404 when update not found", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: null, error: null }),
      );

      const res = await request(app)
        .patch(
          "/api/v1/projects/00000000-0000-0000-0000-000000000030/updates/00000000-0000-0000-0000-000000000999",
        )
        .set("Authorization", "Bearer token-123")
        .send({ body: "Updated" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /:id/updates/:updateId", () => {
    it("deletes a project update", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: null, error: null }),
      );

      const res = await request(app)
        .delete("/api/v1/projects/00000000-0000-0000-0000-000000000030/updates/upd-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(204);
    });
  });

  describe("PATCH /:id/tasks/:taskId/comments/:commentId", () => {
    it("updates a task comment", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: COMMENT, error: null }),
      );

      const res = await request(app)
        .patch(
          "/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/00000000-0000-0000-0000-000000000031/comments/cmt-1",
        )
        .set("Authorization", "Bearer token-123")
        .send({ body: "Updated comment" });

      expect(res.status).toBe(200);
    });

    it("returns 404 when comment not found", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: null, error: null }),
      );

      const res = await request(app)
        .patch(
          "/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/00000000-0000-0000-0000-000000000031/comments/00000000-0000-0000-0000-000000000999",
        )
        .set("Authorization", "Bearer token-123")
        .send({ body: "Updated" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /:id/tasks/:taskId/comments/:commentId", () => {
    it("deletes a task comment", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: null, error: null }),
      );

      const res = await request(app)
        .delete(
          "/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/00000000-0000-0000-0000-000000000031/comments/cmt-1",
        )
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(204);
    });
  });

  describe("GET /:id/tasks/read-states", () => {
    it("returns read states", async () => {
      mockAuth();
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: [READ_STATE], error: null }),
      );

      const res = await request(app)
        .get("/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/read-states")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });
  });

  describe("POST /:id/tasks/reorder", () => {
    it("reorders tasks", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .post("/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/reorder")
        .set("Authorization", "Bearer token-123")
        .send({
          order: ["00000000-0000-0000-0000-000000000031", "00000000-0000-0000-0000-000000000032"],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.reordered).toBe(2);
    });
  });

  describe("POST /:id/tasks/:taskId/read", () => {
    it("marks a task as read via RPC", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({ data: { id: "00000000-0000-0000-0000-000000000030" }, error: null }),
      );
      supabase.rpc.mockResolvedValue({ data: null, error: null });

      const res = await request(app)
        .post(
          "/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/00000000-0000-0000-0000-000000000031/read",
        )
        .set("Authorization", "Bearer token-123")
        .send({ organizationId: "00000000-0000-0000-0000-000000000001" });

      expect(res.status).toBe(200);
      expect(res.body.data.marked).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith(
        "mark_task_read",
        expect.objectContaining({ p_user_id: "00000000-0000-0000-0000-000000000777" }),
      );
    });
  });

  describe("POST /:id/tasks/:taskId/approve", () => {
    it("approves a task via RPC", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: PROJECT, error: null }));
      supabase.rpc.mockResolvedValue({ data: null, error: null });

      const res = await request(app)
        .post(
          "/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/00000000-0000-0000-0000-000000000031/approve",
        )
        .set("Authorization", "Bearer token-123")
        .send({ organizationId: "00000000-0000-0000-0000-000000000001" });

      expect(res.status).toBe(200);
      expect(res.body.data.approved).toBe(true);
    });
  });

  describe("POST /:id/tasks/:taskId/portal-comment", () => {
    it("adds a portal comment via RPC", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({ data: { id: "00000000-0000-0000-0000-000000000030" }, error: null }),
      );
      supabase.rpc.mockResolvedValue({ data: null, error: null });

      const res = await request(app)
        .post(
          "/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/00000000-0000-0000-0000-000000000031/portal-comment",
        )
        .set("Authorization", "Bearer token-123")
        .send({ organizationId: "00000000-0000-0000-0000-000000000001", body: "Portal comment" });

      expect(res.status).toBe(201);
    });
  });

  describe("by-id tenant scoping", () => {
    const ORG = "00000000-0000-0000-0000-000000000001";

    function mockMissingProject() {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({ data: null, error: new Error("not found") }),
      );
      return supabase;
    }

    it("PATCH /:id filters the fetch and update by organization_id", async () => {
      const supabase = mockAuth();
      const builder = createMockBuilder({ data: PROJECT, error: null });
      supabase.from.mockReturnValue(builder);

      const res = await request(app)
        .patch(`/api/v1/projects/00000000-0000-0000-0000-000000000030?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123")
        .send({ name: "Updated" });

      expect(res.status).toBe(200);
      expect(builder.eq).toHaveBeenCalledWith("organization_id", ORG);
    });

    it("PATCH /:id returns 404 when the project is in another org", async () => {
      mockMissingProject();

      const res = await request(app)
        .patch(`/api/v1/projects/00000000-0000-0000-0000-000000000999?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123")
        .send({ name: "Updated" });

      expect(res.status).toBe(404);
    });

    it("GET /:id/tasks returns 404 when the project is in another org", async () => {
      mockMissingProject();

      const res = await request(app)
        .get(`/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });

    it("POST /:id/tasks returns 404 when the project is in another org", async () => {
      mockMissingProject();

      const res = await request(app)
        .post(`/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123")
        .send({ title: "New Task", status: "todo", sortOrder: 1, approvalRequired: false });

      expect(res.status).toBe(404);
    });

    it("DELETE /:id/tasks/:taskId returns 404 when the project is in another org", async () => {
      mockMissingProject();

      const res = await request(app)
        .delete(
          `/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/00000000-0000-0000-0000-000000000031?organization_id=${ORG}`,
        )
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });

    it("POST /:id/tasks/:taskId/comments returns 404 when the project is in another org", async () => {
      mockMissingProject();

      const res = await request(app)
        .post(
          `/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/00000000-0000-0000-0000-000000000031/comments?organization_id=${ORG}`,
        )
        .set("Authorization", "Bearer token-123")
        .send({ body: "New comment", isInternal: false });

      expect(res.status).toBe(404);
    });

    it("POST /:id/tasks/reorder returns 404 when the project is in another org", async () => {
      mockMissingProject();

      const res = await request(app)
        .post(`/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/reorder?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123")
        .send({ order: ["00000000-0000-0000-0000-000000000031"] });

      expect(res.status).toBe(404);
    });

    it("POST /:id/updates returns 404 when the project is in another org", async () => {
      mockMissingProject();

      const res = await request(app)
        .post(`/api/v1/projects/00000000-0000-0000-0000-000000000030/updates?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123")
        .send({ body: "Update", isInternal: false, isPinned: false });

      expect(res.status).toBe(404);
    });

    it("POST /:id/tasks/:taskId/read returns 404 when the project is in another org", async () => {
      mockMissingProject();

      const res = await request(app)
        .post(
          `/api/v1/projects/00000000-0000-0000-0000-000000000030/tasks/00000000-0000-0000-0000-000000000031/read?organization_id=${ORG}`,
        )
        .set("Authorization", "Bearer token-123")
        .send({ organizationId: ORG });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /:id/detail", () => {
    it("returns compound project detail in a single call", async () => {
      const supabase = mockAuth();
      const projectWithTasks = {
        ...PROJECT,
        project_tasks: [TASK],
        organization_id: "00000000-0000-0000-0000-000000000001",
      };

      const projectBuilder = createMockBuilder({
        data: projectWithTasks,
        error: null,
      });
      const membershipBuilder = createMockBuilder({
        data: [{ id: "m1", user_id: "user-1", role_id: "r1", status: "approved" }],
        error: null,
      });
      const taskBuilder = createMockBuilder({ data: [TASK], error: null });
      const commentBuilder = createMockBuilder({
        data: [COMMENT],
        error: null,
      });
      const readStateBuilder = createMockBuilder({
        data: [READ_STATE],
        error: null,
      });
      const profileBuilder = createMockBuilder({
        data: [{ id: "user-1", full_name: "Test", email: "t@t.com" }],
        error: null,
      });
      const roleBuilder = createMockBuilder({
        data: [{ id: "r1", key: "admin", name: "Admin" }],
        error: null,
      });

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return projectBuilder;
        if (callCount === 2) return membershipBuilder;
        if (callCount === 3) return taskBuilder;
        if (callCount === 4) return commentBuilder;
        if (callCount === 5) return readStateBuilder;
        if (callCount === 6) return profileBuilder;
        return roleBuilder;
      });

      const res = await request(app)
        .get("/api/v1/projects/00000000-0000-0000-0000-000000000030/detail")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.project).toBeDefined();
      expect(res.body.data.memberships).toBeDefined();
      expect(res.body.data.profiles).toBeDefined();
      expect(res.body.data.roles).toBeDefined();
      expect(res.body.data.tasks).toBeDefined();
      expect(res.body.data.comments).toBeDefined();
      expect(res.body.data.readStates).toBeDefined();
    });

    it("returns 404 when project not found", async () => {
      const supabase = mockAuth();
      const projectBuilder = createMockBuilder({
        data: null,
        error: { message: "Not found" },
      });
      supabase.from.mockReturnValue(projectBuilder);

      const res = await request(app)
        .get("/api/v1/projects/00000000-0000-0000-0000-000000000999/detail")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });
});
