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

// Route-level suite: gates are stubbed; enforcement is covered by the
// middleware suites.
jest.mock("../middleware/auth", () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock("../middleware/admin", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (_req: unknown, _res: unknown, next: () => void) => next(),
  assertOrgScopeMatches: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import storeRouter from "../routes/store";

interface SetupOptions {
  failTables?: string[];
}

function setup({ failTables = [] }: SetupOptions = {}) {
  const inserts: Record<string, any> = {};

  const from = jest.fn((table: string) => {
    const builder = createMockBuilder({ data: null as unknown, error: null });
    let mode: "read" | "write" = "read";

    (builder as any).insert = jest.fn((payload: unknown) => {
      inserts[table] = payload;
      mode = "write";
      return builder;
    });

    (builder as any).then = (
      onFulfilled?: (v: unknown) => unknown,
      onRejected?: (v: unknown) => unknown,
    ) => {
      const failed = mode === "write" && failTables.includes(table);
      const result = failed
        ? { data: null, error: { message: `${table} unavailable` } }
        : { data: mode === "write" ? { id: `${table}-1` } : [{ id: `${table}-1` }], error: null };
      return Promise.resolve(result).then(onFulfilled as never, onRejected as never);
    };

    return builder;
  });

  (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });
  return { inserts, from };
}

const app = createTestApp();
app.use("/api/v1/store", storeRouter);
app.use(errorHandler);

const validQuote = {
  name: "Jane Buyer",
  email: "jane@example.com",
  phone: "207-555-0100",
  notes: "We need help",
  items: [{ productId: "password-security-checkup", name: "Password Security Checkup" }],
};

describe("store quote submission wiring", () => {
  beforeEach(() => jest.clearAllMocks());

  it("stores the quote, the structured quote request and a scored lead", async () => {
    const { inserts } = setup();

    const res = await request(app).post("/api/v1/store/quotes").send(validQuote);

    expect(res.status).toBe(201);
    expect(inserts.store_quotes).toMatchObject({
      name: "Jane Buyer",
      email: "jane@example.com",
      phone: "207-555-0100",
    });
    expect(inserts.store_quote_requests).toMatchObject({ status: "submitted" });
    expect(inserts.store_quote_requests.customer).toMatchObject({ email: "jane@example.com" });
    expect(inserts.store_leads).toMatchObject({
      status: "new",
      quote_request_id: "store_quote_requests-1",
      lead_score: 0,
      lead_band: "low",
      follow_up_due_at: null,
    });
    expect(inserts.store_leads.score_breakdown).toEqual([]);
  });

  it("scores the lead and schedules follow-up for high-intent quotes", async () => {
    const { inserts } = setup();

    const res = await request(app)
      .post("/api/v1/store/quotes")
      .send({
        ...validQuote,
        userCount: 25,
        items: [
          { productId: "emergency-support-response", name: "Emergency Support" },
          { productId: "monthly-it-plans-essentials", name: "Monthly IT Plan" },
        ],
      });

    expect(res.status).toBe(201);
    expect(inserts.store_leads.lead_score).toBe(85);
    expect(inserts.store_leads.lead_band).toBe("priority");
    expect(inserts.store_leads.follow_up_due_at).not.toBeNull();
    expect(inserts.store_leads.score_breakdown.map((b: any) => b.rule)).toEqual(
      expect.arrayContaining(["emergency_selected", "monthly_plan_selected", "multiple_items"]),
    );
  });

  it("still accepts the quote when lead capture fails", async () => {
    const { inserts } = setup({ failTables: ["store_quote_requests"] });

    const res = await request(app).post("/api/v1/store/quotes").send(validQuote);

    expect(res.status).toBe(201);
    expect(inserts.store_quotes).toBeDefined();
    expect(inserts.store_leads).toBeUndefined();
  });

  it("rejects an invalid quote payload", async () => {
    setup();

    const res = await request(app)
      .post("/api/v1/store/quotes")
      .send({ name: "", email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("lists quote requests for admins", async () => {
    setup();

    const res = await request(app).get("/api/v1/store/quote-requests");

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it("lists scored leads for admins", async () => {
    setup();

    const res = await request(app).get("/api/v1/store/leads");

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});
