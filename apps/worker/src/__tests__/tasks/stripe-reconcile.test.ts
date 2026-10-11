import { jest } from "@jest/globals";

/**
 * Regression tests for the Stripe reconciliation task (audit BILL-P2-003).
 *
 * Before this fix the task only suspended on terminal states, never compared
 * the local billing mirror with Stripe, and returned `{ ok: true }` even when
 * individual Stripe calls failed — so mirror drift was invisible.
 */

jest.mock("pino", () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return jest.fn(() => mockLogger);
});

jest.mock("dotenv/config", () => ({}));

jest.mock("../../env", () => ({
  env: {
    LOG_LEVEL: "silent",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    STRIPE_SECRET_KEY: "sk_test_unit",
  },
}));

jest.mock("../../services/supabase", () => ({
  wsTransport: undefined,
  getSupabaseAdmin: jest.fn(),
}));

jest.mock("../../metrics", () => ({
  recordStripeReconcileDrift: jest.fn(),
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

import { createClient } from "@supabase/supabase-js";
import { recordStripeReconcileDrift } from "../../metrics";
import { stripeReconcile } from "../../tasks/stripe-reconcile";

const driftMetric = recordStripeReconcileDrift as unknown as jest.Mock;

const ORG = "00000000-0000-0000-0000-000000000001";

interface DbError {
  message: string;
}

interface DbResult {
  data?: unknown;
  error?: DbError | null;
}

interface MockWrite {
  values: Record<string, unknown>;
  filters: Array<[string, unknown]>;
}

interface MockState {
  billingCustomers: Array<{ organization_id: string; stripe_customer_id: string }>;
  subscriptions: Array<{
    organization_id: string;
    stripe_subscription_id: string;
    status: string;
    created_at: string;
  }>;
  invoices: Array<{ organization_id: string; total_cents: number }>;
  payments: Array<{ organization_id: string; amount_cents: number; status: string }>;
  membershipUpdates: MockWrite[];
  subscriptionUpdates: MockWrite[];
  failSubscriptionSelect?: boolean;
}

function makeSupabase(state: MockState) {
  return {
    from(table: string) {
      const filters: Array<[string, unknown]> = [];
      let op: "select" | "update" = "select";
      let values: Record<string, unknown> = {};

      const resolve = (): DbResult => {
        const eqValue = (column: string): unknown => filters.find(([c]) => c === column)?.[1];
        switch (table) {
          case "billing_customers":
            return { data: state.billingCustomers, error: null };
          case "subscriptions":
            if (op === "update") {
              state.subscriptionUpdates.push({ values, filters: [...filters] });
              return { data: null, error: null };
            }
            if (state.failSubscriptionSelect) {
              return { data: null, error: { message: "db unavailable" } };
            }
            return {
              data: state.subscriptions.filter(
                (s) => s.organization_id === eqValue("organization_id"),
              ),
              error: null,
            };
          case "memberships":
            state.membershipUpdates.push({ values, filters: [...filters] });
            return { data: null, error: null };
          case "invoices":
            return {
              data: state.invoices.filter(
                (i) => i.organization_id === eqValue("organization_id"),
              ),
              error: null,
            };
          case "payments":
            return {
              data: state.payments.filter(
                (p) => p.organization_id === eqValue("organization_id"),
              ),
              error: null,
            };
          default:
            return { data: null, error: null };
        }
      };

      const query: Record<string, unknown> = {};
      query.select = jest.fn(() => query);
      query.eq = jest.fn((column: string, value: unknown) => {
        filters.push([column, value]);
        return query;
      });
      query.not = jest.fn(() => query);
      query.order = jest.fn(() => query);
      query.limit = jest.fn(() => query);
      query.update = jest.fn((next: Record<string, unknown>) => {
        op = "update";
        values = next;
        return query;
      });
      query.then = (
        onFulfilled: (value: DbResult) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve(resolve()).then(onFulfilled, onRejected);

      return query;
    },
  };
}

interface FetchRoutes {
  subscription?: unknown;
  subscriptionStatus?: number;
  invoices?: unknown[];
  invoicesHasMore?: boolean;
  paymentIntents?: unknown[];
}

const realFetch = globalThis.fetch;

function installFetch(routes: FetchRoutes): void {
  const fetchMock = jest.fn(async (input: unknown) => {
    const url = String(input);
    if (url.includes("/subscriptions/")) {
      const status = routes.subscriptionStatus ?? 200;
      return {
        ok: status === 200,
        status,
        headers: new Headers(),
        json: async () => routes.subscription ?? null,
      };
    }
    if (url.includes("/invoices")) {
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          data: routes.invoices ?? [],
          has_more: routes.invoicesHasMore ?? false,
        }),
      };
    }
    if (url.includes("/payment_intents")) {
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ data: routes.paymentIntents ?? [], has_more: false }),
      };
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
}

function baseState(overrides: Partial<MockState> = {}): MockState {
  return {
    billingCustomers: [{ organization_id: ORG, stripe_customer_id: "cus_test" }],
    subscriptions: [
      {
        organization_id: ORG,
        stripe_subscription_id: "sub_test",
        status: "active",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ],
    invoices: [],
    payments: [],
    membershipUpdates: [],
    subscriptionUpdates: [],
    ...overrides,
  };
}

function stripeSubscription(status: string) {
  return {
    id: "sub_test",
    status,
    current_period_start: 1_767_225_600,
    current_period_end: 1_769_817_600,
    cancel_at_period_end: false,
    items: { data: [{ price: { id: "price_test", unit_amount: 9900, currency: "usd" } }] },
  };
}

describe("stripeReconcile drift detection (BILL-P2-003)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("fails the run, records the drift metric and repairs the mirror on subscription status drift", async () => {
    const state = baseState();
    (createClient as unknown as jest.Mock).mockReturnValue(makeSupabase(state));
    installFetch({ subscription: stripeSubscription("canceled") });

    const result = await stripeReconcile({});

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/drift/);
    expect(driftMetric).toHaveBeenCalledWith("subscription_status");
    // Stripe is the source of truth: the mirror is repaired in the same run.
    expect(state.subscriptionUpdates).toHaveLength(1);
    expect(state.subscriptionUpdates[0].values).toMatchObject({
      status: "canceled",
      amount_cents: 9900,
      currency: "usd",
    });
    // Terminal state suspends approved memberships.
    expect(state.membershipUpdates).toHaveLength(1);
    expect(state.membershipUpdates[0].values).toEqual({ status: "suspended" });
  });

  it("returns ok:true and records no drift when the mirror matches Stripe", async () => {
    const state = baseState({
      invoices: [{ organization_id: ORG, total_cents: 1200 }],
      payments: [{ organization_id: ORG, amount_cents: 1200, status: "succeeded" }],
    });
    (createClient as unknown as jest.Mock).mockReturnValue(makeSupabase(state));
    installFetch({
      subscription: stripeSubscription("active"),
      invoices: [{ id: "in_test", status: "paid", total: 1200 }],
      paymentIntents: [{ id: "pi_test", status: "succeeded", amount: 1200, amount_received: 1200 }],
    });

    const result = await stripeReconcile({});

    expect(result.ok).toBe(true);
    expect(driftMetric).not.toHaveBeenCalled();
    expect(state.membershipUpdates).toHaveLength(0);
    // The write-back still refreshes the mirror on a clean run.
    expect(state.subscriptionUpdates).toHaveLength(1);
  });

  it("records invoice and payment count/sum drift", async () => {
    const state = baseState({
      invoices: [{ organization_id: ORG, total_cents: 1000 }],
      payments: [{ organization_id: ORG, amount_cents: 500, status: "succeeded" }],
    });
    (createClient as unknown as jest.Mock).mockReturnValue(makeSupabase(state));
    installFetch({
      subscription: stripeSubscription("active"),
      invoices: [
        { id: "in_1", status: "paid", total: 1000 },
        { id: "in_2", status: "paid", total: 2500 },
      ],
      paymentIntents: [
        { id: "pi_1", status: "succeeded", amount: 500, amount_received: 500 },
        { id: "pi_2", status: "succeeded", amount: 750, amount_received: 750 },
      ],
    });

    const result = await stripeReconcile({});

    expect(result.ok).toBe(false);
    expect(driftMetric).toHaveBeenCalledWith("invoice_count");
    expect(driftMetric).toHaveBeenCalledWith("invoice_sum");
    expect(driftMetric).toHaveBeenCalledWith("payment_count");
    expect(driftMetric).toHaveBeenCalledWith("payment_sum");
  });

  it("returns ok:false when a Stripe call fails (was ok:true before the fix)", async () => {
    const state = baseState();
    (createClient as unknown as jest.Mock).mockReturnValue(makeSupabase(state));
    installFetch({ subscriptionStatus: 500 });

    const result = await stripeReconcile({});

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/error/);
    expect(driftMetric).not.toHaveBeenCalled();
  });

  it("mirrors the trial, interval and cancellation lifecycle on write-back (BILL-P2-001/P2-005)", async () => {
    const state = baseState({
      subscriptions: [
        {
          organization_id: ORG,
          stripe_subscription_id: "sub_test",
          status: "trialing",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    (createClient as unknown as jest.Mock).mockReturnValue(makeSupabase(state));
    installFetch({
      subscription: {
        ...stripeSubscription("trialing"),
        trial_start: 1_767_225_600,
        trial_end: 1_768_089_600,
        cancel_at_period_end: true,
        canceled_at: null,
        items: {
          data: [
            {
              quantity: 5,
              price: {
                id: "price_test",
                unit_amount: 9900,
                currency: "usd",
                recurring: { interval: "month" },
              },
            },
          ],
        },
      },
    });

    const result = await stripeReconcile({});

    expect(result.ok).toBe(true);
    expect(state.subscriptionUpdates).toHaveLength(1);
    expect(state.subscriptionUpdates[0].values).toMatchObject({
      status: "trialing",
      interval: "month",
      cancel_at_period_end: true,
      canceled_at: null,
      quantity: 5,
    });
    expect(state.subscriptionUpdates[0].values.trial_start).toBe(
      new Date(1_767_225_600 * 1000).toISOString(),
    );
    expect(state.subscriptionUpdates[0].values.trial_end).toBe(
      new Date(1_768_089_600 * 1000).toISOString(),
    );
  });

  it("returns ok:false when the subscription mirror cannot be read", async () => {
    const state = baseState({ failSubscriptionSelect: true });
    (createClient as unknown as jest.Mock).mockReturnValue(makeSupabase(state));
    installFetch({ subscription: stripeSubscription("active") });

    const result = await stripeReconcile({});

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/error/);
  });

  it("does not suspend a past_due (still dunning) subscription", async () => {
    const state = baseState({
      subscriptions: [
        {
          organization_id: ORG,
          stripe_subscription_id: "sub_test",
          status: "past_due",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    (createClient as unknown as jest.Mock).mockReturnValue(makeSupabase(state));
    installFetch({ subscription: stripeSubscription("past_due") });

    const result = await stripeReconcile({});

    expect(result.ok).toBe(true);
    expect(state.membershipUpdates).toHaveLength(0);
  });

  it("dryRun detects drift but never mutates the mirror or memberships", async () => {
    const state = baseState();
    (createClient as unknown as jest.Mock).mockReturnValue(makeSupabase(state));
    installFetch({ subscription: stripeSubscription("canceled") });

    const result = await stripeReconcile({ dryRun: true });

    expect(result.ok).toBe(false);
    expect(driftMetric).toHaveBeenCalledWith("subscription_status");
    expect(state.subscriptionUpdates).toHaveLength(0);
    expect(state.membershipUpdates).toHaveLength(0);
  });
});
