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
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));

jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock("../lib/webhook-dispatcher", () => ({
  dispatchWebhook: jest.fn(),
}));

jest.mock("../middleware/auth", () => ({
  requireAuth: (req: { authUser?: { userId: string } }, _res: unknown, next: () => void) => {
    req.authUser = { userId: "00000000-0000-0000-0000-0000000000aa" };
    next();
  },
}));
jest.mock("../middleware/admin", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import { dispatchWebhook } from "../lib/webhook-dispatcher";
import storeRouter from "../routes/store";

const quoteRequestRow = {
  id: "qr-1",
  status: "submitted",
  customer: { name: "Jane Buyer", email: "jane@example.com" },
  items: [{ productId: "password-security-checkup", name: "Password Security Checkup" }],
  notes: "Need help",
};

function setup({
  rows = {},
  failTables = [],
}: { rows?: Record<string, unknown>; failTables?: string[] } = {}) {
  const inserts: Record<string, any> = {};
  const updates: Record<string, any> = {};

  const from = jest.fn((table: string) => {
    const builder = createMockBuilder({ data: null as unknown, error: null });
    let mode: "read" | "write" | "update" = "read";

    (builder as any).insert = jest.fn((payload: unknown) => {
      inserts[table] = payload;
      mode = "write";
      return builder;
    });
    (builder as any).update = jest.fn((payload: unknown) => {
      updates[table] = payload;
      mode = "update";
      return builder;
    });

    (builder as any).then = (
      onFulfilled?: (v: unknown) => unknown,
      onRejected?: (v: unknown) => unknown,
    ) => {
      const failed = mode !== "read" && failTables.includes(table);
      let data: unknown = null;
      if (!failed) {
        if (mode === "read") data = table in rows ? rows[table] : [{ id: `${table}-1` }];
        else data = { id: `${table}-1` };
      }
      const result = failed
        ? { data: null, error: { message: `${table} unavailable` } }
        : { data, error: null };
      return Promise.resolve(result).then(onFulfilled as never, onRejected as never);
    };

    return builder;
  });

  (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });
  return { inserts, updates };
}

const app = createTestApp();
app.use("/api/v1/store", storeRouter);
app.use(errorHandler);

const validBody = {
  organizationId: "00000000-0000-0000-0000-000000000001",
  projectName: "Q4 Security Uplift",
  priority: "high",
};

describe("POST /store/quote-requests/:id/convert", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates the project, checklist and ticket, then flips the source rows", async () => {
    const { inserts, updates } = setup({
      rows: { store_quote_requests: quoteRequestRow, store_leads: [{ id: "lead-1" }] },
    });

    const res = await request(app)
      .post("/api/v1/store/quote-requests/qr-1/convert")
      .send(validBody);

    expect(res.status).toBe(201);
    expect(inserts.projects).toMatchObject({
      organization_id: validBody.organizationId,
      created_by: "00000000-0000-0000-0000-0000000000aa",
      name: "Q4 Security Uplift",
      status: "planned",
      priority: "high",
      metadata: { quoteRequestId: "qr-1", source: "store_intake" },
    });

    expect(Array.isArray(inserts.project_tasks)).toBe(true);
    expect(inserts.project_tasks).toHaveLength(9);
    expect(inserts.project_tasks[0]).toMatchObject({
      organization_id: validBody.organizationId,
      project_id: "projects-1",
      title: "Review intake",
      status: "todo",
      sort_order: 0,
    });

    expect(inserts.tickets).toMatchObject({
      organization_id: validBody.organizationId,
      category: "store_intake",
      source: "admin",
      status: "new",
      priority: "high",
    });
    expect(inserts.tickets.metadata).toMatchObject({
      quoteRequestId: "qr-1",
      projectId: "projects-1",
    });

    expect(updates.store_quote_requests).toMatchObject({ status: "converted_to_project" });
    expect(updates.store_leads).toMatchObject({ status: "converted" });
    expect(dispatchWebhook).toHaveBeenCalledWith(
      "project.created",
      validBody.organizationId,
      expect.objectContaining({ source: "store_intake" }),
    );
  });

  it("returns 404 for an unknown quote request", async () => {
    setup({ rows: { store_quote_requests: null } });

    const res = await request(app)
      .post("/api/v1/store/quote-requests/missing/convert")
      .send(validBody);

    expect(res.status).toBe(404);
  });

  it("returns 409 when the quote request was already converted", async () => {
    setup({
      rows: { store_quote_requests: { ...quoteRequestRow, status: "converted_to_project" } },
    });

    const res = await request(app)
      .post("/api/v1/store/quote-requests/qr-1/convert")
      .send(validBody);

    expect(res.status).toBe(409);
  });

  it("rejects a missing organization id", async () => {
    setup();

    const res = await request(app).post("/api/v1/store/quote-requests/qr-1/convert").send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("fails when the project insert fails", async () => {
    setup({ rows: { store_quote_requests: quoteRequestRow }, failTables: ["projects"] });

    const res = await request(app)
      .post("/api/v1/store/quote-requests/qr-1/convert")
      .send(validBody);

    expect(res.status).toBe(500);
  });
});
