import { jest } from "@jest/globals";
import request from "supertest";
import billingRouter from "../routes/billing";
import { createTestApp, createMockBuilder, type MockResult } from "./helpers";
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
    APP_BASE_URL: "http://localhost:3000",
    STRIPE_SECRET_KEY: "sk_test_x",
    STRIPE_WEBHOOK_SECRET: "",
  }),
}));

jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn(),
    getScopedClient: jest.fn((_req, _moduleKey, _kind) => require("../services/supabase").getSupabaseAdmin()) }));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));
jest.mock("../lib/http-client", () => ({
  httpClients: {
    stripe: {
      fetch: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { getSupabaseAdmin } from "../services/supabase";
import { httpClients } from "../lib/http-client";
import { clearPermissionCache } from "../lib/permissions";
import { getEnv } from "../config/env";

function mockAuth() {
  const supabase: any = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "admin-1", email: "admin@test.com" } },
    error: null,
  });
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
const app = createTestApp();

/*
 * Test-only stand-in for the stubbed `requireOrgAccess`: lets each test set the
 * org the middleware would have resolved into `req.orgId`. The route handlers
 * must treat that as the authority for tenant scoping.
 */
let stubOrgId: string | null = null;
app.use((req, _res, next) => {
  if (stubOrgId) req.orgId = stubOrgId;
  next();
});

app.use("/api/v1/billing", billingRouter);
app.use(errorHandler);

describe("billing routes", () => {
  let supabase: any;

  beforeEach(() => {
    supabase = mockAuth();
    stubOrgId = null;
    jest.clearAllMocks();
    // PERF-P2-003: the portal-session path resolves permissions directly, so
    // reset the short-TTL cache between tests (same user/org fixtures).
    clearPermissionCache();
  });

  const ORG_DEFAULT = "00000000-0000-0000-0000-000000000001";

  /**
   * Table-aware mock for the billing GETs: the routes resolve the caller's
   * admin tenant scope (memberships + profile) before applying the mandatory
   * org predicate, so every read test must serve those tables alongside the
   * route's own table.
   */
  function mockRead(
    opts: {
      routeResults?: Record<string, MockResult>;
      roleKey?: string;
      isSuperAdmin?: boolean;
      memberOrgs?: string[];
    } = {},
  ) {
    const builders: Record<string, ReturnType<typeof createMockBuilder>> = {};
    supabase.from.mockImplementation((table: string) => {
      let result: MockResult;
      if (table === "memberships") {
        result = {
          data: (opts.memberOrgs ?? [ORG_DEFAULT]).map((org) => ({
            organization_id: org,
            roles: { id: "role-1", key: opts.roleKey ?? "member" },
          })),
          error: null,
        };
      } else if (table === "profiles") {
        result = { data: { is_super_admin: opts.isSuperAdmin ?? false }, error: null };
      } else {
        result = opts.routeResults?.[table] ?? { data: null, error: null };
      }
      const builder = createMockBuilder(result);
      builders[table] = builder;
      return builder;
    });
    return builders;
  }

  it("GET /invoices returns paginated invoices", async () => {
    mockRead({
      routeResults: { invoices: { data: [{ id: "inv1" }], error: null, count: 1 } },
    });
    const res = await request(app)
      .get("/api/v1/billing/invoices")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("GET /subscriptions returns subscriptions", async () => {
    mockRead({
      routeResults: {
        subscriptions: { data: [{ id: "sub1", plan_name: "Premium" }], error: null },
      },
    });
    const res = await request(app)
      .get("/api/v1/billing/subscriptions")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("GET /payments returns paginated payments", async () => {
    mockRead({ routeResults: { payments: { data: [], error: null, count: 0 } } });
    const res = await request(app)
      .get("/api/v1/billing/payments")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("lists payments without a mirrored invoice (left join, BILL-P3-004)", async () => {
    const builders = mockRead({
      routeResults: {
        payments: {
          data: [{ id: "pay-unlinked", invoice_id: null, invoices: null }],
          error: null,
          count: 1,
        },
      },
    });
    const res = await request(app)
      .get("/api/v1/billing/payments")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].invoices).toBeNull();
    const selectArg = builders.payments.select.mock.calls[0][0];
    expect(selectArg).toContain("invoices(");
    expect(selectArg).not.toContain("!inner");
  });

  it("counts trialing plans in the summary active count (BILL-P3-006)", async () => {
    const builders = mockRead({
      routeResults: {
        subscriptions: { data: null, error: null, count: 1 },
        invoices: { data: [], error: null, count: 0 },
      },
    });
    const res = await request(app)
      .get("/api/v1/billing/summary")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.data.activeSubscriptions).toBe(1);
    expect(builders.subscriptions.in).toHaveBeenCalledWith("status", ["active", "trialing"]);
  });

  it("redacts the payment-method id and decrypts the billing email (BILL-P3-002)", async () => {
    const { encryptField } = await import("../lib/field-encryption");
    mockRead({
      routeResults: {
        billing_customers: {
          data: {
            id: "cust-1",
            billing_email: encryptField("billing@acme.test"),
            default_payment_method: "pm_1234567890abcdef",
          },
          error: null,
        },
      },
    });
    const res = await request(app)
      .get("/api/v1/billing/billing-customer")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.data.billing_email).toBe("billing@acme.test");
    expect(res.body.data.default_payment_method).not.toBe("pm_1234567890abcdef");
    expect(res.body.data.default_payment_method).toBe("pm_••••cdef");
  });

  it("GET /billing-customer returns null when no org_id and no customer", async () => {
    mockRead({
      routeResults: {
        billing_customers: {
          data: null,
          error: { code: "PGRST116", message: "No rows found" },
          count: 0,
        },
      },
    });
    const res = await request(app)
      .get("/api/v1/billing/billing-customer")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it("GET /invoices/:id scopes the query to the caller's organization", async () => {
    const builders = mockRead({
      routeResults: {
        invoices: { data: { id: "inv1", total_cents: 5000 }, error: null },
      },
    });
    const res = await request(app)
      .get(
        "/api/v1/billing/invoices/inv1?organization_id=00000000-0000-0000-0000-000000000001",
      )
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("inv1");
    expect(builders.invoices.eq).toHaveBeenCalledWith(
      "organization_id",
      "00000000-0000-0000-0000-000000000001",
    );
  });

  it("GET /invoices/:id returns 404 for an invoice in another org", async () => {
    mockRead({
      memberOrgs: [
        "00000000-0000-0000-0000-000000000001",
        "00000000-0000-0000-0000-000000000002",
      ],
      routeResults: {
        invoices: { data: null, error: new Error("No rows") },
      },
    });
    const res = await request(app)
      .get(
        "/api/v1/billing/invoices/inv-other?organization_id=00000000-0000-0000-0000-000000000002",
      )
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(404);
  });

  describe("GET tenant scoping (BILL-P2-008)", () => {
    const ORG_A = "00000000-0000-0000-0000-000000000001";
    const ORG_B = "00000000-0000-0000-0000-000000000002";

    it("scopes reads to the caller's orgs for a cross-tenant role holder without is_super_admin", async () => {
      const builders = mockRead({
        roleKey: "admin",
        isSuperAdmin: false,
        memberOrgs: [ORG_A],
        routeResults: { invoices: { data: [], error: null, count: 0 } },
      });

      const res = await request(app)
        .get("/api/v1/billing/invoices")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      // Mandatory tenant predicate: an `admin` role alone must NOT see every
      // tenant's billing data.
      expect(builders.invoices.in).toHaveBeenCalledWith("organization_id", [ORG_A]);

      const { logAuditEvent } = await import("../services/audit");
      expect(logAuditEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: "billing.cross_tenant_read" }),
      );
    });

    it("fails closed when a non-super-admin requests an org they are not in", async () => {
      mockRead({
        roleKey: "admin",
        isSuperAdmin: false,
        memberOrgs: [ORG_A],
        routeResults: { invoices: { data: [], error: null } },
      });

      const res = await request(app)
        .get(`/api/v1/billing/invoices?organization_id=${ORG_B}`)
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(403);
    });

    it("audits implicit all-tenant reads by a genuine cross-tenant admin", async () => {
      const builders = mockRead({
        roleKey: "super_admin",
        isSuperAdmin: true,
        memberOrgs: [ORG_A],
        routeResults: { invoices: { data: [], error: null, count: 0 } },
      });

      const res = await request(app)
        .get("/api/v1/billing/invoices")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      // allTenants: no per-org predicate is added...
      expect(builders.invoices.in).not.toHaveBeenCalled();
      // ...but the implicit all-tenant read is audited.
      const { logAuditEvent } = await import("../services/audit");
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "billing.cross_tenant_read",
          entityType: "billing",
        }),
      );
    });
  });

  it("GET / returns 401 without auth", async () => {
    const res = await request(app).get("/api/v1/billing/invoices");
    expect(res.status).toBe(401);
  });

  describe("POST /create-portal-session", () => {
    const ORG_A = "00000000-0000-0000-0000-000000000001";

    /**
     * Table-aware mock for the portal path: the route first probes memberships
     * for a billing contact, then (if needed) resolves effective permissions.
     */
    function mockStripePortal(
      opts: {
        billingContact?: boolean;
        billingManage?: boolean;
        superAdmin?: boolean;
        customer?: MockResult;
      } = {},
    ) {
      (httpClients.stripe.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ url: "https://billing.stripe.com/session/xyz" }),
      });
      const builders: Record<string, ReturnType<typeof createMockBuilder>> = {};
      let membershipCalls = 0;
      supabase.from.mockImplementation((table: string) => {
        let result: MockResult;
        if (table === "memberships") {
          membershipCalls += 1;
          if (opts.billingContact) {
            result = { data: { id: "membership-1" }, error: null };
          } else if (opts.billingManage && membershipCalls > 1) {
            result = {
              data: [
                {
                  id: "membership-1",
                  organization_id: ORG_A,
                  role_id: "role-finance",
                  status: "approved",
                  roles: { id: "role-finance", key: "finance" },
                },
              ],
              error: null,
            };
          } else {
            result = { data: null, error: null };
          }
        } else if (table === "billing_customers") {
          result = opts.customer ?? { data: { stripe_customer_id: "cus_123" }, error: null };
        } else if (table === "profiles") {
          result = { data: { is_super_admin: opts.superAdmin ?? false }, error: null };
        } else if (table === "role_permissions") {
          result = opts.billingManage
            ? { data: [{ role_id: "role-finance", permission_id: "perm-billing" }], error: null }
            : { data: [], error: null };
        } else if (table === "permissions") {
          result = opts.billingManage
            ? {
                data: [
                  {
                    id: "perm-billing",
                    module_key: "billing",
                    action_key: "manage",
                    description: null,
                  },
                ],
                error: null,
              }
            : { data: [], error: null };
        } else {
          result = { data: null, error: null };
        }
        const builder = createMockBuilder(result);
        builders[table] = builder;
        return builder;
      });
      return builders;
    }

    it("reads the org from the body (SDK sends organizationId in the body)", async () => {
      const builders = mockStripePortal({ billingContact: true });
      const res = await request(app)
        .post("/api/v1/billing/create-portal-session")
        .set("Authorization", "Bearer token")
        .send({ organizationId: ORG_A });
      expect(res.status).toBe(200);
      expect(res.body.data.url).toBe("https://billing.stripe.com/session/xyz");
      expect(builders.billing_customers.eq).toHaveBeenCalledWith("organization_id", ORG_A);
    });

    it("still accepts organization_id from the query string", async () => {
      const builders = mockStripePortal({ billingContact: true });
      const res = await request(app)
        .post(`/api/v1/billing/create-portal-session?organization_id=${ORG_A}`)
        .set("Authorization", "Bearer token");
      expect(res.status).toBe(200);
      expect(builders.billing_customers.eq).toHaveBeenCalledWith("organization_id", ORG_A);
    });

    it("falls back to the X-Active-Org header (web client sends no body org)", async () => {
      const builders = mockStripePortal({ billingContact: true });
      const res = await request(app)
        .post("/api/v1/billing/create-portal-session")
        .set("Authorization", "Bearer token")
        .set("X-Active-Org", ORG_A);
      expect(res.status).toBe(200);
      expect(builders.billing_customers.eq).toHaveBeenCalledWith("organization_id", ORG_A);
    });

    it("returns 400 when no org can be resolved", async () => {
      mockStripePortal();
      const res = await request(app)
        .post("/api/v1/billing/create-portal-session")
        .set("Authorization", "Bearer token");
      expect(res.status).toBe(400);
    });

    it("returns 404 when the org has no Stripe customer", async () => {
      mockStripePortal({
        billingContact: true,
        customer: { data: null, error: { code: "PGRST116", message: "No rows" } },
      });
      const res = await request(app)
        .post("/api/v1/billing/create-portal-session")
        .set("Authorization", "Bearer token")
        .send({ organizationId: ORG_A });
      expect(res.status).toBe(404);
    });

    it("allows a billing contact to open the portal", async () => {
      const builders = mockStripePortal({ billingContact: true });
      const res = await request(app)
        .post("/api/v1/billing/create-portal-session")
        .set("Authorization", "Bearer token")
        .send({ organizationId: ORG_A });
      expect(res.status).toBe(200);
      expect(builders.memberships.eq).toHaveBeenCalledWith("is_billing_contact", true);
      expect(httpClients.stripe.fetch).toHaveBeenCalled();
    });

    it("returns 403 for a member who is not a billing contact", async () => {
      mockStripePortal({ billingContact: false });
      const res = await request(app)
        .post("/api/v1/billing/create-portal-session")
        .set("Authorization", "Bearer token")
        .send({ organizationId: ORG_A });
      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe("FORBIDDEN");
      expect(httpClients.stripe.fetch).not.toHaveBeenCalled();
    });

    it("allows a member with the billing:manage permission", async () => {
      mockStripePortal({ billingContact: false, billingManage: true });
      const res = await request(app)
        .post("/api/v1/billing/create-portal-session")
        .set("Authorization", "Bearer token")
        .send({ organizationId: ORG_A });
      expect(res.status).toBe(200);
      expect(httpClients.stripe.fetch).toHaveBeenCalled();
    });

    it("allows a super admin (admin bypass)", async () => {
      mockStripePortal({ billingContact: false, superAdmin: true });
      const res = await request(app)
        .post("/api/v1/billing/create-portal-session")
        .set("Authorization", "Bearer token")
        .send({ organizationId: ORG_A });
      expect(res.status).toBe(200);
      expect(httpClients.stripe.fetch).toHaveBeenCalled();
    });
  });

  describe("POST /sync tenant scoping", () => {
    const ORG_A = "00000000-0000-0000-0000-000000000001";
    const ORG_B = "00000000-0000-0000-0000-000000000002";

    function mockSync(opts: {
      isSuperAdmin?: boolean;
      roleKey?: string;
      memberOrgs?: string[];
      customers?: Array<{ stripe_customer_id: string; organization_id: string }>;
    }) {
      const builders: Record<string, ReturnType<typeof createMockBuilder>> = {};
      supabase.from.mockImplementation((table: string) => {
        let result: MockResult;
        if (table === "memberships") {
          result = {
            data: (opts.memberOrgs ?? [ORG_A]).map((org) => ({
              organization_id: org,
              roles: { id: "role-1", key: opts.roleKey ?? "admin" },
            })),
            error: null,
          };
        } else if (table === "profiles") {
          result = { data: { is_super_admin: opts.isSuperAdmin ?? false }, error: null };
        } else if (table === "billing_customers") {
          result = { data: opts.customers ?? [], error: null };
        } else {
          result = { data: null, error: null };
        }
        const builder = createMockBuilder(result);
        builders[table] = builder;
        return builder;
      });
      // Stripe returns empty pages so the sync completes and the test only
      // proves which tenant was selected (a failed Stripe call now fails the
      // sync — see the pagination suite below).
      (httpClients.stripe.get as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [], has_more: false }),
      });
      return builders;
    }

    it("without a body org, scopes the sync to the caller's resolved org", async () => {
      stubOrgId = ORG_A;
      const builders = mockSync({
        customers: [{ stripe_customer_id: "cus_A", organization_id: ORG_A }],
      });

      const res = await request(app)
        .post("/api/v1/billing/sync")
        .set("Authorization", "Bearer token")
        .send({});

      expect(res.status).toBe(200);
      expect(builders.billing_customers.eq).toHaveBeenCalledWith("organization_id", ORG_A);
      expect(res.body.data.synced).toBe(1);
    });

    it("rejects a body organizationId outside the caller's scope", async () => {
      stubOrgId = ORG_A;
      mockSync({});

      const res = await request(app)
        .post("/api/v1/billing/sync")
        .set("Authorization", "Bearer token")
        .send({ organizationId: ORG_B });

      expect(res.status).toBe(403);
    });

    it("lets a genuine cross-tenant admin sync an explicitly named org", async () => {
      stubOrgId = null;
      const builders = mockSync({
        isSuperAdmin: true,
        roleKey: "super_admin",
        memberOrgs: [ORG_A],
        customers: [{ stripe_customer_id: "cus_B", organization_id: ORG_B }],
      });

      const res = await request(app)
        .post("/api/v1/billing/sync")
        .set("Authorization", "Bearer token")
        .send({ organizationId: ORG_B });

      expect(res.status).toBe(200);
      expect(builders.billing_customers.eq).toHaveBeenCalledWith("organization_id", ORG_B);
      expect(res.body.data.synced).toBe(1);
    });

    it("never silently syncs every tenant when no org can be resolved", async () => {
      stubOrgId = null;
      mockSync({ isSuperAdmin: true, roleKey: "super_admin", memberOrgs: [ORG_A] });

      const res = await request(app)
        .post("/api/v1/billing/sync")
        .set("Authorization", "Bearer token")
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("POST /sync pagination (BILL-P2-002)", () => {
    const ORG_A = "00000000-0000-0000-0000-000000000001";
    const CUSTOMER = "cus_A";

    type StripePage = { data: Array<Record<string, unknown>>; has_more: boolean };

    function invoicePage(id: string, hasMore: boolean): StripePage {
      return {
        data: [
          {
            id,
            number: id.toUpperCase(),
            status: "open",
            subtotal: 100,
            tax: 0,
            total: 100,
            currency: "usd",
            hosted_invoice_url: null,
            invoice_pdf: null,
            due_date: null,
          },
        ],
        has_more: hasMore,
      };
    }

    function mockScopeAndCustomer(extra: Record<string, MockResult> = {}) {
      const builders: Record<string, any[]> = {};
      supabase.from.mockImplementation((table: string) => {
        let result: MockResult;
        if (table === "memberships") {
          result = {
            data: [{ organization_id: ORG_A, roles: { id: "role-1", key: "admin" } }],
            error: null,
          };
        } else if (table === "profiles") {
          result = { data: { is_super_admin: false }, error: null };
        } else if (table === "billing_customers") {
          result = {
            data: [{ stripe_customer_id: CUSTOMER, organization_id: ORG_A }],
            error: null,
          };
        } else if (extra[table]) {
          result = extra[table];
        } else {
          result = { data: null, error: null };
        }
        const builder = createMockBuilder(result);
        (builders[table] ??= []).push(builder);
        return builder;
      });
      return builders;
    }

    function mockStripePages(
      pages: Partial<
        Record<"invoices" | "subscriptions" | "payment_intents" | "charges", StripePage[]>
      >,
    ) {
      const calls: Record<string, number> = {};
      (httpClients.stripe.get as jest.Mock).mockImplementation((url: string) => {
        const kind = url.includes("/invoices")
          ? "invoices"
          : url.includes("/subscriptions")
            ? "subscriptions"
            : url.includes("/charges")
              ? "charges"
              : "payment_intents";
        const pageList = pages[kind] ?? [{ data: [], has_more: false }];
        const index = calls[kind] ?? 0;
        calls[kind] = index + 1;
        return Promise.resolve({
          ok: true,
          json: async () => pageList[Math.min(index, pageList.length - 1)],
        });
      });
    }

    it("loops on has_more/starting_after and syncs every page", async () => {
      stubOrgId = ORG_A;
      const builders = mockScopeAndCustomer();
      mockStripePages({
        invoices: [invoicePage("in_1", true), invoicePage("in_2", false)],
        subscriptions: [{ data: [], has_more: false }],
        payment_intents: [{ data: [], has_more: false }],
      });

      const res = await request(app)
        .post("/api/v1/billing/sync")
        .set("Authorization", "Bearer token")
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.counts.invoices).toBe(2);

      const invoiceUrls = (httpClients.stripe.get as jest.Mock).mock.calls
        .map((call) => call[0] as string)
        .filter((url) => url.includes("/invoices"));
      expect(invoiceUrls).toHaveLength(2);
      expect(invoiceUrls[1]).toContain("starting_after=in_1");

      const upsertedIds = (builders.invoices ?? []).map(
        (builder) => builder.upsert.mock.calls[0]?.[0]?.stripe_invoice_id,
      );
      expect(upsertedIds).toEqual(["in_1", "in_2"]);
    });

    it("reports page-cap truncation as a failed sync", async () => {
      stubOrgId = ORG_A;
      mockScopeAndCustomer();
      mockStripePages({
        invoices: Array.from({ length: 12 }, (_, i) => invoicePage(`in_${i}`, true)),
        subscriptions: [{ data: [], has_more: false }],
        payment_intents: [{ data: [], has_more: false }],
      });

      const res = await request(app)
        .post("/api/v1/billing/sync")
        .set("Authorization", "Bearer token")
        .send({});

      expect(res.status).toBe(502);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("STRIPE_SYNC_INCOMPLETE");
      expect(res.body.error.details.errors.join(" ")).toContain("page cap");
    });

    it("reports a failed Stripe call as a failed sync instead of skipping it", async () => {
      stubOrgId = ORG_A;
      mockScopeAndCustomer();
      (httpClients.stripe.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/invoices")) {
          return Promise.resolve({ ok: false, status: 500, text: async () => "upstream boom" });
        }
        return Promise.resolve({ ok: true, json: async () => ({ data: [], has_more: false }) });
      });

      const res = await request(app)
        .post("/api/v1/billing/sync")
        .set("Authorization", "Bearer token")
        .send({});

      expect(res.status).toBe(502);
      expect(res.body.error.code).toBe("STRIPE_SYNC_INCOMPLETE");
      expect(res.body.error.details.errors[0]).toContain("invoices");
      expect(res.body.error.details.errors[0]).toContain("500");
    });

    // PERF-P2-006: the page cap is operator-controlled so accounts with more
    // than 1000 objects per list can complete without a code change.
    it("honors a raised STRIPE_SYNC_MAX_PAGES for large accounts [PERF-P2-006]", async () => {
      stubOrgId = ORG_A;
      mockScopeAndCustomer();
      mockStripePages({
        invoices: Array.from({ length: 12 }, (_, i) => invoicePage(`in_${i}`, i < 11)),
        subscriptions: [{ data: [], has_more: false }],
        payment_intents: [{ data: [], has_more: false }],
      });

      const previousEnv = (getEnv as jest.Mock)() as Record<string, unknown>;
      (getEnv as jest.Mock).mockReturnValue({ ...previousEnv, STRIPE_SYNC_MAX_PAGES: 12 });
      try {
        const res = await request(app)
          .post("/api/v1/billing/sync")
          .set("Authorization", "Bearer token")
          .send({});

        expect(res.status).toBe(200);
        expect(res.body.data.counts.invoices).toBe(12);
      } finally {
        (getEnv as jest.Mock).mockReturnValue(previousEnv);
      }
    });

    it("does not downgrade a refunded payment during sync (BILL-P2-007)", async () => {
      stubOrgId = ORG_A;
      const builders = mockScopeAndCustomer({
        payments: {
          data: [{ stripe_payment_intent_id: "pi_refunded", status: "refunded" }],
          error: null,
        },
      });
      mockStripePages({
        invoices: [{ data: [], has_more: false }],
        subscriptions: [{ data: [], has_more: false }],
        payment_intents: [
          {
            data: [
              {
                id: "pi_refunded",
                status: "succeeded",
                amount: 1000,
                amount_received: 1000,
                currency: "usd",
                created: 1700000000,
                invoice: null,
                customer: CUSTOMER,
              },
            ],
            has_more: false,
          },
        ],
      });

      const res = await request(app)
        .post("/api/v1/billing/sync")
        .set("Authorization", "Bearer token")
        .send({});

      expect(res.status).toBe(200);
      // Stripe's PaymentIntent status is still `succeeded` after a refund, so
      // the sync must not overwrite the locally recorded terminal status.
      const paymentUpserts = (builders.payments ?? []).flatMap(
        (builder) => builder.upsert.mock.calls,
      );
      expect(paymentUpserts).toHaveLength(0);
      expect(res.body.data.counts.payments).toBe(0);
    });

    it("persists the trial, interval and cancellation lifecycle on synced subscriptions", async () => {
      stubOrgId = ORG_A;
      const builders = mockScopeAndCustomer();
      mockStripePages({
        subscriptions: [
          {
            data: [
              {
                id: "sub_1",
                status: "trialing",
                current_period_start: 1700000000,
                current_period_end: 1702592000,
                trial_start: 1700000000,
                trial_end: 1701000000,
                cancel_at_period_end: true,
                canceled_at: null,
                items: {
                  data: [
                    {
                      quantity: 3,
                      price: {
                        nickname: "Pro",
                        unit_amount: 9900,
                        currency: "usd",
                        recurring: { interval: "month" },
                      },
                    },
                  ],
                },
              },
            ],
            has_more: false,
          },
        ],
      });

      const res = await request(app)
        .post("/api/v1/billing/sync")
        .set("Authorization", "Bearer token")
        .send({});

      expect(res.status).toBe(200);
      const upsertArgs = (builders.subscriptions ?? [])[0].upsert.mock.calls[0][0];
      expect(upsertArgs.status).toBe("trialing");
      expect(upsertArgs.interval).toBe("month");
      expect(upsertArgs.trial_start).toBe(new Date(1700000000 * 1000).toISOString());
      expect(upsertArgs.trial_end).toBe(new Date(1701000000 * 1000).toISOString());
      expect(upsertArgs.cancel_at_period_end).toBe(true);
      expect(upsertArgs.quantity).toBe(3);
    });

    it("timestamps void invoices on sync", async () => {
      stubOrgId = ORG_A;
      const builders = mockScopeAndCustomer();
      mockStripePages({
        invoices: [
          {
            data: [
              {
                id: "in_void",
                number: "INV-V",
                status: "void",
                subtotal: 100,
                tax: 0,
                total: 100,
                currency: "usd",
                hosted_invoice_url: null,
                invoice_pdf: null,
                due_date: null,
                status_transitions: { voided_at: 1700000900 },
              },
            ],
            has_more: false,
          },
        ],
      });

      const res = await request(app)
        .post("/api/v1/billing/sync")
        .set("Authorization", "Bearer token")
        .send({});

      expect(res.status).toBe(200);
      const upsertArgs = (builders.invoices ?? [])[0].upsert.mock.calls[0][0];
      expect(upsertArgs.status).toBe("void");
      expect(upsertArgs.voided_at).toBe(new Date(1700000900 * 1000).toISOString());
    });

    it("records paid_at from status_transitions when Stripe provides it (BILL-P3-003)", async () => {
      stubOrgId = ORG_A;
      const builders = mockScopeAndCustomer();
      mockStripePages({
        invoices: [
          {
            data: [
              {
                id: "in_paid_ts",
                number: "INV-P1",
                status: "paid",
                subtotal: 100,
                tax: 0,
                total: 100,
                currency: "usd",
                hosted_invoice_url: null,
                invoice_pdf: null,
                due_date: null,
                created: 1699999000,
                status_transitions: { paid_at: 1700000900 },
              },
            ],
            has_more: false,
          },
        ],
      });

      const res = await request(app)
        .post("/api/v1/billing/sync")
        .set("Authorization", "Bearer token")
        .send({});

      expect(res.status).toBe(200);
      const upsertArgs = (builders.invoices ?? [])[0].upsert.mock.calls[0][0];
      expect(upsertArgs.paid_at).toBe(new Date(1700000900 * 1000).toISOString());
    });

    it("falls back to the invoice created time when paid_at is missing (BILL-P3-003)", async () => {
      stubOrgId = ORG_A;
      const builders = mockScopeAndCustomer();
      mockStripePages({
        invoices: [
          {
            data: [
              {
                id: "in_paid_no_ts",
                number: "INV-P2",
                status: "paid",
                subtotal: 100,
                tax: 0,
                total: 100,
                currency: "usd",
                hosted_invoice_url: null,
                invoice_pdf: null,
                due_date: null,
                created: 1700000100,
                status_transitions: {},
              },
            ],
            has_more: false,
          },
        ],
      });

      const res = await request(app)
        .post("/api/v1/billing/sync")
        .set("Authorization", "Bearer token")
        .send({});

      expect(res.status).toBe(200);
      const upsertArgs = (builders.invoices ?? [])[0].upsert.mock.calls[0][0];
      expect(upsertArgs.paid_at).toBe(new Date(1700000100 * 1000).toISOString());
    });

    it("never writes an epoch paid_at when Stripe omits both timestamps (BILL-P3-003)", async () => {
      stubOrgId = ORG_A;
      const builders = mockScopeAndCustomer();
      mockStripePages({
        invoices: [
          {
            data: [
              {
                id: "in_paid_bare",
                number: "INV-P3",
                status: "paid",
                subtotal: 100,
                tax: 0,
                total: 100,
                currency: "usd",
                hosted_invoice_url: null,
                invoice_pdf: null,
                due_date: null,
              },
            ],
            has_more: false,
          },
        ],
      });

      const res = await request(app)
        .post("/api/v1/billing/sync")
        .set("Authorization", "Bearer token")
        .send({});

      expect(res.status).toBe(200);
      const upsertArgs = (builders.invoices ?? [])[0].upsert.mock.calls[0][0];
      expect(upsertArgs.paid_at).not.toContain("1970");
      const parsed = Date.parse(upsertArgs.paid_at);
      expect(Number.isNaN(parsed)).toBe(false);
      expect(parsed).toBeGreaterThan(Date.now() - 60_000);
    });

    it("backfills refunded payments from Stripe charges, repairing the PI upsert", async () => {
      stubOrgId = ORG_A;
      const builders = mockScopeAndCustomer();
      mockStripePages({
        payment_intents: [
          {
            data: [
              {
                id: "pi_1",
                status: "succeeded",
                amount: 55000,
                amount_received: 55000,
                currency: "usd",
                created: 1700000000,
                invoice: null,
              },
            ],
            has_more: false,
          },
        ],
        charges: [
          {
            data: [
              {
                id: "ch_1",
                payment_intent: "pi_1",
                amount: 55000,
                amount_refunded: 10000,
                refunds: { data: [{ id: "re_1", created: 1700000500 }] },
              },
            ],
            has_more: false,
          },
        ],
      });

      const res = await request(app)
        .post("/api/v1/billing/sync")
        .set("Authorization", "Bearer token")
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.counts.refunds).toBe(1);

      const refundUpdate = (builders.payments ?? [])
        .map((builder) => builder.update.mock.calls[0]?.[0])
        .find((args) => args && args.status === "partially_refunded");
      expect(refundUpdate).toMatchObject({
        status: "partially_refunded",
        refund_amount_cents: 10000,
        refunded_at: new Date(1700000500 * 1000).toISOString(),
      });
    });

    it("fails the sync when the charges page cannot be fetched", async () => {
      stubOrgId = ORG_A;
      mockScopeAndCustomer();
      (httpClients.stripe.get as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/charges")) {
          return Promise.resolve({ ok: false, status: 500, text: async () => "upstream boom" });
        }
        return Promise.resolve({ ok: true, json: async () => ({ data: [], has_more: false }) });
      });

      const res = await request(app)
        .post("/api/v1/billing/sync")
        .set("Authorization", "Bearer token")
        .send({});

      expect(res.status).toBe(502);
      expect(res.body.error.details.errors[0]).toContain("charges");
      expect(res.body.error.details.errors[0]).toContain("500");
    });
  });
});
