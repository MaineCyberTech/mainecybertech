import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder } from "./helpers";
import { errorHandler } from "../middleware/error";

/**
 * Regression coverage for the store tenant-isolation sweep
 * (MT-P0-003/004/005): a single-org `admin` must not be able to read or mutate
 * another tenant's store rows, while a genuine cross-tenant admin still can.
 *
 * The admin/org gates have their own suites; they are stubbed here so what is
 * under test is the handler-level `resolveAdminTenantScope` +
 * `applyOrgScope` predicate.
 */

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
jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireOrgAccessByParam: (_req: unknown, _res: unknown, next: () => void) => next(),
  assertOrgScopeMatches: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import storeRouter from "../routes/store";

const ORG_A = "00000000-0000-0000-0000-00000000000a";
const ORG_B = "00000000-0000-0000-0000-00000000000b";

type TenantMode = "single" | "cross";

interface QueryCall {
  table: string;
  method: "eq" | "in" | "is";
  column: string;
  value: unknown;
}

interface SetupOptions {
  mode?: TenantMode;
  existingOrgId?: string | null;
  profile?: { is_super_admin: boolean };
  roleKey?: string;
  rows?: Record<string, unknown>;
  failTables?: string[];
}

/**
 * Table-aware Supabase mock. It records the filters applied by the handlers so
 * tests can assert the mandatory org predicate, and serves:
 *   - `profiles`/`memberships` for `resolveAdminTenantScope`
 *   - `[row]` for list reads (`select("*")`)
 *   - a single row for existence checks (`select("id...")`)
 *   - write echoes for insert/update/upsert
 */
function setup({
  mode = "single",
  existingOrgId = ORG_A,
  profile = { is_super_admin: false },
  roleKey,
  rows = {},
  failTables = [],
}: SetupOptions = {}) {
  const inserts: Record<string, any> = {};
  const updates: Record<string, any> = {};
  const upserts: Record<string, any> = {};
  const queryCalls: QueryCall[] = [];

  const from = jest.fn((table: string) => {
    const builder = createMockBuilder({ data: null as unknown, error: null });
    let op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
    let selectArg = "*";

    (builder as any).select = jest.fn((...args: unknown[]) => {
      selectArg = String(args[0] ?? "*");
      return builder;
    });
    (builder as any).insert = jest.fn((payload: unknown) => {
      inserts[table] = payload;
      op = "insert";
      return builder;
    });
    (builder as any).upsert = jest.fn((payload: unknown) => {
      upserts[table] = payload;
      op = "upsert";
      return builder;
    });
    (builder as any).update = jest.fn((payload: unknown) => {
      updates[table] = payload;
      op = "update";
      return builder;
    });
    (builder as any).delete = jest.fn(() => {
      op = "delete";
      return builder;
    });

    const filter =
      (method: "eq" | "in" | "is") =>
      (column: string, value: unknown): unknown => {
        queryCalls.push({ table, method, column, value });
        return builder;
      };
    (builder as any).eq = jest.fn(filter("eq"));
    (builder as any).in = jest.fn(filter("in"));
    (builder as any).is = jest.fn(filter("is"));

    (builder as any).then = (
      onFulfilled?: (v: unknown) => unknown,
      onRejected?: (v: unknown) => unknown,
    ) => {
      const failed = op !== "select" && failTables.includes(table);
      let data: unknown = null;
      if (!failed) {
        if (op === "select") {
          if (table in rows) data = rows[table];
          else if (table === "profiles") data = profile;
          else if (table === "memberships") {
            data = [
              {
                organization_id: ORG_A,
                roles:
                  roleKey != null
                    ? { id: "r", key: roleKey }
                    : mode === "cross"
                      ? { id: "r", key: "super_admin" }
                      : { id: "r", key: "admin" },
              },
            ];
          } else if (selectArg === "*") {
            data = [{ id: `${table}-1`, organization_id: existingOrgId }];
          } else {
            data = { id: `${table}-1`, organization_id: existingOrgId };
          }
        } else if (op === "insert" || op === "update" || op === "upsert") {
          data = { id: `${table}-1`, organization_id: existingOrgId };
        }
      }
      const result = failed
        ? { data: null, error: { message: `${table} unavailable` } }
        : { data, error: null };
      return Promise.resolve(result).then(onFulfilled as never, onRejected as never);
    };

    return builder;
  });

  (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });
  return { inserts, updates, upserts, queryCalls, from };
}

const app = createTestApp();
app.use("/api/v1/store", storeRouter);
app.use(errorHandler);

const expectOrgPredicate = (queryCalls: QueryCall[], table: string, orgId = ORG_A) =>
  expect(queryCalls).toEqual(
    expect.arrayContaining([{ table, method: "in", column: "organization_id", value: [orgId] }]),
  );

describe("store catalog tenant isolation (MT-P0-003)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects a single-org admin reading another org's product by id", async () => {
    const { queryCalls } = setup({ mode: "single", rows: { store_products: [] } });

    const res = await request(app).get("/api/v1/store/products/by-id/p-1");

    expect(res.status).toBe(404);
    expect(queryCalls).toEqual(
      expect.arrayContaining([
        { table: "store_products", method: "in", column: "organization_id", value: [ORG_A] },
      ]),
    );
  });

  it("allows a genuine cross-tenant admin to read any product by id", async () => {
    setup({
      mode: "cross",
      profile: { is_super_admin: true },
      rows: {
        store_products: [
          {
            id: "p-1",
            slug: "p-1",
            name: "Product One",
            category_id: null,
            category: "",
            type: "service",
            display: true,
            status: "active",
            price_range: "",
            pricing_model: "",
            purchase_mode: "",
            summary: "",
            marketing_headline: "",
            marketing_copy: "",
            tags: [],
            attributes: {},
            organization_id: ORG_B,
          },
        ],
      },
    });

    const res = await request(app).get("/api/v1/store/products/by-id/p-1");

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("p-1");
  });

  it("rejects a single-org admin mutating another org's product", async () => {
    const { updates } = setup({ mode: "single", existingOrgId: ORG_B });

    const res = await request(app)
      .patch("/api/v1/store/products/p-1")
      .send({ name: "Hijacked" });

    expect(res.status).toBe(403);
    expect(updates.store_products).toBeUndefined();
  });

  it("lets a genuine cross-tenant admin mutate another org's product", async () => {
    const { updates } = setup({
      mode: "cross",
      profile: { is_super_admin: true },
      existingOrgId: ORG_B,
    });

    const res = await request(app)
      .patch("/api/v1/store/products/p-1")
      .send({ name: "Patched" });

    expect(res.status).toBe(200);
    expect(updates.store_products).toMatchObject({ name: "Patched" });
  });

  it("rejects a single-org admin deleting another org's product", async () => {
    setup({ mode: "single", existingOrgId: ORG_B });

    const res = await request(app).delete("/api/v1/store/products/p-1");

    expect(res.status).toBe(403);
  });

  it("pins a single-org admin's new product to their org", async () => {
    const { upserts } = setup({ mode: "single" });

    const res = await request(app)
      .post("/api/v1/store/products")
      .send({ slug: "tenant-product", name: "Tenant Product" });

    expect(res.status).toBe(201);
    expect(upserts.store_products).toMatchObject({ organization_id: ORG_A });
  });

  it("rejects a single-org admin hijacking another org's product via create/upsert", async () => {
    setup({ mode: "single", existingOrgId: ORG_B });

    const res = await request(app)
      .post("/api/v1/store/products")
      .send({ slug: "victim", name: "Victim" });

    expect(res.status).toBe(403);
  });

  it("rejects a single-org admin mutating another org's category", async () => {
    const { updates } = setup({ mode: "single", existingOrgId: ORG_B });

    const res = await request(app)
      .patch("/api/v1/store/categories/c-1")
      .send({ name: "Hijacked" });

    expect(res.status).toBe(403);
    expect(updates.store_categories).toBeUndefined();
  });

  it("rejects a single-org admin deleting a global (null-org) category", async () => {
    setup({ mode: "single", existingOrgId: null });

    const res = await request(app).delete("/api/v1/store/categories/c-1");

    expect(res.status).toBe(403);
  });

  it("pins a single-org admin's new category to their org", async () => {
    const { upserts } = setup({ mode: "single" });

    const res = await request(app)
      .post("/api/v1/store/categories")
      .send({ slug: "tenant-category", name: "Tenant Category" });

    expect(res.status).toBe(201);
    expect(upserts.store_categories).toMatchObject({ organization_id: ORG_A });
  });
});

describe("store promotions tenant isolation (MT-P0-004)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("scopes a single-org admin's promotion list to their own org", async () => {
    const { queryCalls } = setup({ mode: "single" });

    const res = await request(app).get("/api/v1/store/promotions/admin");

    expect(res.status).toBe(200);
    expectOrgPredicate(queryCalls, "store_promotions");
  });

  it("leaves a genuine cross-tenant admin's promotion list unscoped", async () => {
    const { queryCalls } = setup({ mode: "cross", profile: { is_super_admin: true } });

    const res = await request(app).get("/api/v1/store/promotions/admin");

    expect(res.status).toBe(200);
    expect(
      queryCalls.filter((c) => c.table === "store_promotions" && c.method === "in"),
    ).toHaveLength(0);
  });

  it("pins a single-org admin's new promotion to their org", async () => {
    const { inserts } = setup({ mode: "single" });

    const res = await request(app)
      .post("/api/v1/store/promotions")
      .send({ name: "Tenant Promo" });

    expect(res.status).toBe(201);
    expect(inserts.store_promotions).toMatchObject({ organization_id: ORG_A });
  });

  it("rejects a single-org admin updating another org's promotion", async () => {
    const { updates } = setup({ mode: "single", existingOrgId: ORG_B });

    const res = await request(app)
      .patch("/api/v1/store/promotions/prom-1")
      .send({ name: "Hijacked" });

    expect(res.status).toBe(403);
    expect(updates.store_promotions).toBeUndefined();
  });

  it("rejects a single-org admin deleting another org's promotion", async () => {
    setup({ mode: "single", existingOrgId: ORG_B });

    const res = await request(app).delete("/api/v1/store/promotions/prom-1");

    expect(res.status).toBe(403);
  });

  it("lets a genuine cross-tenant admin mutate another org's promotion", async () => {
    const { updates } = setup({
      mode: "cross",
      profile: { is_super_admin: true },
      existingOrgId: ORG_B,
    });

    const res = await request(app)
      .patch("/api/v1/store/promotions/prom-1")
      .send({ name: "Patched" });

    expect(res.status).toBe(200);
    expect(updates.store_promotions).toMatchObject({ name: "Patched" });
  });
});

describe("store quotes tenant isolation (MT-P0-005)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("scopes a single-org admin's quote list to their own org", async () => {
    const { queryCalls } = setup({ mode: "single" });

    const res = await request(app).get("/api/v1/store/quotes");

    expect(res.status).toBe(200);
    expectOrgPredicate(queryCalls, "store_quotes");
  });

  it("leaves a genuine cross-tenant admin's quote list unscoped", async () => {
    const { queryCalls } = setup({ mode: "cross", profile: { is_super_admin: true } });

    const res = await request(app).get("/api/v1/store/quotes");

    expect(res.status).toBe(200);
    expect(queryCalls.filter((c) => c.table === "store_quotes" && c.method === "in")).toHaveLength(0);
  });

  it("does not scope non-org tables such as store_leads and store_quote_requests", async () => {
    const { queryCalls } = setup({ mode: "single" });

    await request(app).get("/api/v1/store/leads");
    await request(app).get("/api/v1/store/quote-requests");

    expect(queryCalls.filter((c) => c.table === "store_leads")).toHaveLength(0);
    expect(queryCalls.filter((c) => c.table === "store_quote_requests")).toHaveLength(0);
  });
});
