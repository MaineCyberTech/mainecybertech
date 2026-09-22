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
import storeRouter from "../routes/store";

interface SetupOptions {
  rows?: Record<string, unknown>;
  failTables?: string[];
}

function setup({ rows = {}, failTables = [] }: SetupOptions = {}) {
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
      let data: unknown;
      if (failed) data = null;
      else if (mode === "read") data = table in rows ? rows[table] : [{ id: `${table}-1` }];
      else data = { id: `${table}-1` };

      const result = failed
        ? { data: null, error: { message: `${table} unavailable` } }
        : { data, error: null };
      return Promise.resolve(result).then(onFulfilled as never, onRejected as never);
    };

    return builder;
  });

  (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });
  return { inserts, updates, from };
}

const app = createTestApp();
app.use("/api/v1/store", storeRouter);
app.use(errorHandler);

const quoteRequestRow = {
  id: "qr-1",
  status: "submitted",
  customer: { name: "Jane Buyer", email: "jane@example.com", phone: null },
  items: [
    { productId: "password-security-checkup", name: "Password Security Checkup" },
    { productId: "monthly-it-plans-essentials", name: "Monthly IT Plan" },
  ],
  notes: "We need a security review",
};

describe("store proposal draft wiring", () => {
  beforeEach(() => jest.clearAllMocks());

  it("generates a proposal draft from a quote request", async () => {
    const { inserts } = setup({ rows: { store_quote_requests: quoteRequestRow } });

    const res = await request(app).post("/api/v1/store/quote-requests/qr-1/proposal").send({});

    expect(res.status).toBe(201);
    expect(inserts.store_proposal_drafts).toMatchObject({
      quote_request_id: "qr-1",
      status: "draft_internal",
    });

    const sections = inserts.store_proposal_drafts.sections;
    expect(sections["Recommended services"].join(" ")).toContain("Password Security Checkup");
    expect(sections["Executive summary"].join(" ")).toContain("Jane Buyer");
    expect(sections["Current situation"].join(" ")).toContain("We need a security review");
    expect(sections["Monthly care path"].join(" ")).toMatch(/already included/i);
    expect(sections.guardrails).toContain("Require human review before sending");
  });

  it("creates and links a first-class proposal when an organization is given", async () => {
    const { inserts, updates } = setup({ rows: { store_quote_requests: quoteRequestRow } });

    const res = await request(app)
      .post("/api/v1/store/quote-requests/qr-1/proposal")
      .send({ organizationId: "00000000-0000-0000-0000-000000000001" });

    expect(res.status).toBe(201);
    expect(inserts.proposals).toMatchObject({
      organization_id: "00000000-0000-0000-0000-000000000001",
      title: "Jane Buyer — proposal",
      status: "draft",
      visibility: "internal",
      created_by: "00000000-0000-0000-0000-0000000000aa",
      metadata: { quoteRequestId: "qr-1", source: "store_intake" },
    });

    expect(inserts.proposal_line_items).toHaveLength(2);
    expect(inserts.proposal_line_items[0]).toMatchObject({
      proposal_id: "proposals-1",
      name: "Password Security Checkup",
      item_type: "one_time",
      quantity: 1,
      sort_order: 0,
    });

    expect(inserts.store_proposal_drafts).toMatchObject({ proposal_id: "proposals-1" });
    expect(updates.proposals).toMatchObject({ grand_total: 0, total_one_time: 0 });
  });

  it("derives line-item amounts from the catalog price range", async () => {
    const { inserts } = setup({
      rows: {
        store_quote_requests: {
          ...quoteRequestRow,
          items: [{ productId: "p-1", name: "Mailbox Migration", priceRange: "$1,200" }],
        },
      },
    });

    const res = await request(app)
      .post("/api/v1/store/quote-requests/qr-1/proposal")
      .send({ organizationId: "00000000-0000-0000-0000-000000000001" });

    expect(res.status).toBe(201);
    expect(inserts.proposal_line_items[0]).toMatchObject({
      unit_price: 1200,
      total_price: 1200,
      description: "Catalog price: $1,200",
    });
    expect(inserts.proposals.metadata).toMatchObject({ source: "store_intake" });
    expect(inserts.store_proposal_drafts.proposal_id).toBe("proposals-1");
  });

  it("returns 404 when the quote request does not exist", async () => {
    setup({ rows: { store_quote_requests: null } });

    const res = await request(app).post("/api/v1/store/quote-requests/missing/proposal").send({});

    expect(res.status).toBe(404);
  });

  it("lists proposal drafts", async () => {
    setup({ rows: { store_proposal_drafts: [{ id: "pd-1", status: "draft_internal" }] } });

    const res = await request(app).get("/api/v1/store/proposal-drafts");

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data[0].id).toBe("pd-1");
  });

  it("updates a proposal draft status", async () => {
    const { updates } = setup({ rows: { store_proposal_drafts: { id: "pd-1" } } });

    const res = await request(app)
      .patch("/api/v1/store/proposal-drafts/pd-1")
      .send({ status: "approved" });

    expect(res.status).toBe(200);
    expect(updates.store_proposal_drafts).toMatchObject({ status: "approved" });
  });

  it("rejects an invalid proposal draft status", async () => {
    setup({ rows: { store_proposal_drafts: { id: "pd-1" } } });

    const res = await request(app)
      .patch("/api/v1/store/proposal-drafts/pd-1")
      .send({ status: "not-a-status" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("rejects an empty proposal draft update", async () => {
    setup({ rows: { store_proposal_drafts: { id: "pd-1" } } });

    const res = await request(app).patch("/api/v1/store/proposal-drafts/pd-1").send({});

    expect(res.status).toBe(400);
  });
});
