import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import webhooksRouter from "../routes/webhooks";
import { webhookBodyParser } from "../middleware/webhook-body";
import { createTestApp, createMockBuilder, type MockResult } from "./helpers";
import { getEnv } from "../config/env";
import { errorHandler } from "../middleware/error";

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest
        .fn()
        .mockReturnValue({ type: "checkout.session.completed", id: "evt_123" }),
    },
  }));
});

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
    STRIPE_SECRET_KEY: "sk_test",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
    JIRA_WEBHOOK_SECRET: "jira-secret",
    JSM_WEBHOOK_SECRET: "jsm-secret",
    M365_CLIENT_STATE: "m365-client-state",
  }),
}));

jest.mock("../services/supabase", () => {
  const createChain = () => {
    const chain = {
      select: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      single: jest.fn(() =>
        Promise.resolve({
          data: { id: "task-1", status: "todo" },
          error: null,
        }),
      ),
      upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => chain),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
    };
    return chain;
  };

  const supabaseClient = {
    from: jest.fn(() => createChain()),
  };

  return { getSupabaseAdmin: jest.fn(() => supabaseClient) };
});

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

jest.mock("../lib/idempotency", () => ({
  checkIdempotencyKey: jest.fn().mockResolvedValue(null),
  claimIdempotencyKey: jest.fn().mockResolvedValue(true),
  storeIdempotencyKey: jest.fn().mockResolvedValue(undefined),
  deleteIdempotencyKey: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../lib/metrics", () => ({
  recordWebhookDelivery: jest.fn(),
  recordBillingDunningNotification: jest.fn(),
}));

jest.mock("../lib/webhook-signature", () => ({
  verifyWebhookSignature: jest.fn().mockReturnValue(true),
  validateWebhookTimestamp: jest.fn().mockReturnValue(true),
  rawBodyBuffer: jest.fn((value: unknown) => {
    if (Buffer.isBuffer(value)) return value;
    if (typeof value === "string") return Buffer.from(value);
    return null;
  }),
}));

jest.mock("../lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("../lib/notify", () => ({
  notifyAndEmail: jest.fn(),
}));

const app = createTestApp();
app.use("/api/v1/webhooks", webhooksRouter);
app.use(errorHandler);

// WH-P2-006: production mounts the per-provider body caps before the global
// parser; this app mirrors that ordering so the caps are exercised end-to-end.
const cappedApp = express();
cappedApp.use(webhookBodyParser());
cappedApp.use("/api/v1/webhooks", webhooksRouter);
cappedApp.use(errorHandler);

describe("webhooks routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /stripe", () => {
    it("processes a Stripe webhook", async () => {
      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "checkout.session.completed", id: "evt_123" });

      expect(res.status).toBe(200);
      expect(res.body.data?.received).toBe(true);
    });

    it("returns 400 when signature is missing", async () => {
      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .send({ type: "checkout.session.completed" });

      expect(res.status).toBe(400);
    });

    it("stores Stripe invoice amounts in minor units without 100x inflation", async () => {
      const StripeMock = (await import("stripe")).default as unknown as jest.Mock;
      const constructEvent = jest.fn().mockReturnValue({
        type: "invoice.paid",
        id: "evt_inv_1",
        data: {
          object: {
            customer: "cus_1",
            id: "in_1",
            number: "INV-1001",
            status: "paid",
            subtotal: 500,
            tax: 50,
            total: 550,
            currency: "usd",
            hosted_invoice_url: "https://invoice.stripe.com/x",
            invoice_pdf: "https://pay.stripe.com/x.pdf",
            due_date: null,
            status_transitions: { paid_at: 1700000000 },
          },
        },
      });
      StripeMock.mockImplementationOnce(() => ({ webhooks: { constructEvent } }));

      const supabaseModule = await import("../services/supabase");
      const builders: Record<string, any> = {};
      const supabase = {
        from: jest.fn().mockImplementation((table: string) => {
          const result =
            table === "billing_customers"
              ? ({ data: { organization_id: "org-1" }, error: null } as MockResult)
              : ({ data: null, error: null } as MockResult);
          const builder = createMockBuilder(result);
          builders[table] = builder;
          return builder;
        }),
      };
      (supabaseModule.getSupabaseAdmin as jest.Mock).mockReturnValueOnce(supabase);

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "invoice.paid", id: "evt_inv_1" });

      expect(res.status).toBe(200);
      const upsertArgs = builders["invoices"].upsert.mock.calls[0][0];
      expect(upsertArgs.subtotal_cents).toBe(500);
      expect(upsertArgs.tax_cents).toBe(50);
      expect(upsertArgs.total_cents).toBe(550);
    });

    function mockStripeEvent(event: unknown) {
      const StripeMock = (jest.requireMock("stripe") as unknown as jest.Mock);
      const constructEvent = jest.fn().mockReturnValue(event);
      StripeMock.mockImplementationOnce(() => ({ webhooks: { constructEvent } }));
    }

    function mockSupabaseWithBuilders(
      tableResults: Record<string, MockResult>,
      fallback: MockResult = { data: null, error: null },
    ) {
      const builders: Record<string, any> = {};
      const supabase = {
        from: jest.fn().mockImplementation((table: string) => {
          const builder = createMockBuilder(tableResults[table] ?? fallback);
          builders[table] = builder;
          return builder;
        }),
      };
      return { supabase, builders };
    }

    it("records a payment row on payment_intent.succeeded (BILL-P1-002)", async () => {
      mockStripeEvent({
        type: "payment_intent.succeeded",
        id: "evt_pi_1",
        data: {
          object: {
            id: "pi_123",
            customer: "cus_1",
            invoice: "in_1",
            amount: 55000,
            amount_received: 55000,
            currency: "usd",
            status: "succeeded",
            created: 1700000000,
          },
        },
      });

      const supabaseModule = await import("../services/supabase");
      const { supabase, builders } = mockSupabaseWithBuilders({
        billing_customers: { data: { organization_id: "org-1" }, error: null },
        invoices: { data: { id: "inv-row-1", organization_id: "org-1" }, error: null },
      });
      (supabaseModule.getSupabaseAdmin as jest.Mock).mockReturnValueOnce(supabase);

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "payment_intent.succeeded", id: "evt_pi_1" });

      expect(res.status).toBe(200);
      const upsertArgs = builders["payments"].upsert.mock.calls[0][0];
      expect(upsertArgs.stripe_payment_intent_id).toBe("pi_123");
      expect(upsertArgs.organization_id).toBe("org-1");
      expect(upsertArgs.invoice_id).toBe("inv-row-1");
      expect(upsertArgs.amount_cents).toBe(55000);
      expect(upsertArgs.status).toBe("succeeded");
    });

    it("records a failed payment row on payment_intent.payment_failed", async () => {
      mockStripeEvent({
        type: "payment_intent.payment_failed",
        id: "evt_pi_2",
        data: {
          object: {
            id: "pi_fail",
            customer: "cus_1",
            invoice: null,
            amount: 1000,
            currency: "usd",
            status: "requires_payment_method",
            created: 1700000001,
          },
        },
      });

      const supabaseModule = await import("../services/supabase");
      const { supabase, builders } = mockSupabaseWithBuilders({
        billing_customers: { data: { organization_id: "org-1" }, error: null },
      });
      (supabaseModule.getSupabaseAdmin as jest.Mock).mockReturnValueOnce(supabase);

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "payment_intent.payment_failed", id: "evt_pi_2" });

      expect(res.status).toBe(200);
      const upsertArgs = builders["payments"].upsert.mock.calls[0][0];
      expect(upsertArgs.status).toBe("failed");
      expect(upsertArgs.paid_at).toBeNull();
    });

    it("notifies the org billing contacts on invoice.payment_failed (BILL-P2-004)", async () => {
      mockStripeEvent({
        type: "invoice.payment_failed",
        id: "evt_inv_fail",
        data: {
          object: {
            customer: "cus_1",
            id: "in_fail",
            number: "INV-2002",
            status: "open",
            subtotal: 5000,
            tax: 0,
            total: 5000,
            currency: "usd",
            hosted_invoice_url: "https://invoice.stripe.com/fail",
            invoice_pdf: null,
            due_date: 1700000000,
          },
        },
      });

      const supabaseModule = await import("../services/supabase");
      const { supabase } = mockSupabaseWithBuilders({
        billing_customers: { data: { organization_id: "org-1" }, error: null },
        memberships: {
          data: [
            { user_id: "u-billing", role_id: "role-billing", roles: { key: "client-billing" } },
          ],
          error: null,
        },
        role_permissions: {
          data: [{ role_id: "role-billing", permissions: { module_key: "billing" } }],
          error: null,
        },
        profiles: { data: [{ id: "u-billing", email: "ap@acme.example" }], error: null },
      });
      (supabaseModule.getSupabaseAdmin as jest.Mock).mockReturnValueOnce(supabase);

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "invoice.payment_failed", id: "evt_inv_fail" });

      expect(res.status).toBe(200);
      const { notifyAndEmail } = await import("../lib/notify");
      expect(notifyAndEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "u-billing",
          organizationId: "org-1",
          module: "billing",
          moduleId: "in_fail",
          action: "payment_failed",
          email: "ap@acme.example",
        }),
      );
    });

    it("marks the linked payment refunded on charge.refunded (BILL-P1-003)", async () => {
      mockStripeEvent({
        type: "charge.refunded",
        id: "evt_refund_1",
        data: {
          object: {
            id: "ch_1",
            payment_intent: "pi_123",
            amount: 55000,
            amount_refunded: 55000,
            currency: "usd",
            refunds: { data: [{ id: "re_1", created: 1700000500 }] },
          },
        },
      });

      const supabaseModule = await import("../services/supabase");
      const { supabase, builders } = mockSupabaseWithBuilders({
        billing_customers: { data: { organization_id: "org-1" }, error: null },
      });
      (supabaseModule.getSupabaseAdmin as jest.Mock).mockReturnValueOnce(supabase);

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "charge.refunded", id: "evt_refund_1" });

      expect(res.status).toBe(200);
      const updateArgs = builders["payments"].update.mock.calls[0][0];
      expect(updateArgs.status).toBe("refunded");
      // BILL-P2-001: the refunded amount and date are stored alongside status.
      expect(updateArgs.refund_amount_cents).toBe(55000);
      expect(updateArgs.refunded_at).toBe(new Date(1700000500 * 1000).toISOString());
    });

    it("marks a partial refund as partially_refunded", async () => {
      mockStripeEvent({
        type: "charge.refunded",
        id: "evt_refund_2",
        data: {
          object: {
            id: "ch_2",
            payment_intent: "pi_124",
            amount: 55000,
            amount_refunded: 10000,
            currency: "usd",
            refunds: { data: [{ id: "re_2", created: 1700000600 }] },
          },
        },
      });

      const supabaseModule = await import("../services/supabase");
      const { supabase, builders } = mockSupabaseWithBuilders({
        billing_customers: { data: { organization_id: "org-1" }, error: null },
      });
      (supabaseModule.getSupabaseAdmin as jest.Mock).mockReturnValueOnce(supabase);

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "charge.refunded", id: "evt_refund_2" });

      expect(res.status).toBe(200);
      const updateArgs = builders["payments"].update.mock.calls[0][0];
      expect(updateArgs.status).toBe("partially_refunded");
      expect(updateArgs.refund_amount_cents).toBe(10000);
      expect(updateArgs.refunded_at).toBe(new Date(1700000600 * 1000).toISOString());
    });

    it("maps invoice.voided onto the void status (BILL-P1-003)", async () => {
      mockStripeEvent({
        type: "invoice.voided",
        id: "evt_void_1",
        data: {
          object: {
            id: "in_void",
            customer: "cus_1",
            status: "void",
            status_transitions: { voided_at: 1700000900 },
          },
        },
      });

      const supabaseModule = await import("../services/supabase");
      const { supabase, builders } = mockSupabaseWithBuilders({
        billing_customers: { data: { organization_id: "org-1" }, error: null },
      });
      (supabaseModule.getSupabaseAdmin as jest.Mock).mockReturnValueOnce(supabase);

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "invoice.voided", id: "evt_void_1" });

      expect(res.status).toBe(200);
      const updateArgs = builders["invoices"].update.mock.calls[0][0];
      expect(updateArgs.status).toBe("void");
      // BILL-P2-005: the void transition is timestamped.
      expect(updateArgs.voided_at).toBe(new Date(1700000900 * 1000).toISOString());
      expect(builders["invoices"].eq).toHaveBeenCalledWith("stripe_invoice_id", "in_void");
    });

    it("maps invoice.marked_uncollectible onto the uncollectible status", async () => {
      mockStripeEvent({
        type: "invoice.marked_uncollectible",
        id: "evt_unc_1",
        data: { object: { id: "in_unc", customer: "cus_1", status: "uncollectible" } },
      });

      const supabaseModule = await import("../services/supabase");
      const { supabase, builders } = mockSupabaseWithBuilders({
        billing_customers: { data: { organization_id: "org-1" }, error: null },
      });
      (supabaseModule.getSupabaseAdmin as jest.Mock).mockReturnValueOnce(supabase);

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "invoice.marked_uncollectible", id: "evt_unc_1" });

      expect(res.status).toBe(200);
      const updateArgs = builders["invoices"].update.mock.calls[0][0];
      expect(updateArgs.status).toBe("uncollectible");
    });

    it("fails the event and releases the claim when a mirror write fails (BILL-P2-006)", async () => {
      mockStripeEvent({
        type: "payment_intent.succeeded",
        id: "evt_pi_write_fail",
        data: {
          object: {
            id: "pi_write_fail",
            customer: "cus_1",
            invoice: null,
            amount: 1000,
            amount_received: 1000,
            currency: "usd",
            status: "succeeded",
            created: 1700000000,
          },
        },
      });

      const supabaseModule = await import("../services/supabase");
      const builders: Record<string, any> = {};
      const supabase = {
        from: jest.fn().mockImplementation((table: string) => {
          let builder: ReturnType<typeof createMockBuilder>;
          if (table === "payments") {
            // The monotonic read succeeds (no existing row); the write fails.
            builder = createMockBuilder({ data: null, error: null });
            (builder as any).upsert = jest.fn(() =>
              Promise.resolve({ data: null, error: { message: "db down" } }),
            );
          } else {
            const result: MockResult =
              table === "billing_customers"
                ? { data: { organization_id: "org-1" }, error: null }
                : { data: null, error: null };
            builder = createMockBuilder(result);
          }
          builders[table] = builder;
          return builder;
        }),
      };
      (supabaseModule.getSupabaseAdmin as jest.Mock).mockReturnValueOnce(supabase);

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "payment_intent.succeeded", id: "evt_pi_write_fail" });

      // Fail loudly so Stripe retries instead of the mirror silently drifting.
      expect(res.status).toBe(500);
      expect(builders["payments"].upsert).toHaveBeenCalled();

      const { recordWebhookDelivery } = await import("../lib/metrics");
      expect(recordWebhookDelivery).toHaveBeenCalledWith(
        "failed",
        "stripe.payment_intent.succeeded",
      );

      const { deleteIdempotencyKey } = await import("../lib/idempotency");
      expect(deleteIdempotencyKey).toHaveBeenCalledWith("stripe-evt_pi_write_fail");
    });

    it("does not mark the event processed when the delivery log write fails (BILL-P2-006)", async () => {
      mockStripeEvent({
        type: "checkout.session.completed",
        id: "evt_log_fail",
        data: {
          object: {
            customer: "cus_1",
            client_reference_id: "org-1",
            customer_details: { email: "ap@acme.example" },
          },
        },
      });

      const supabaseModule = await import("../services/supabase");
      const { supabase } = mockSupabaseWithBuilders({
        webhook_deliveries: { data: null, error: { message: "delivery log down" } },
      });
      // The handler resolves the admin client once for the mirror writes and
      // `logWebhookDelivery` resolves it again, so stub both calls.
      (supabaseModule.getSupabaseAdmin as jest.Mock)
        .mockReturnValueOnce(supabase)
        .mockReturnValueOnce(supabase);

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "checkout.session.completed", id: "evt_log_fail" });

      expect(res.status).toBe(500);
      const { deleteIdempotencyKey, storeIdempotencyKey } = await import("../lib/idempotency");
      expect(deleteIdempotencyKey).toHaveBeenCalledWith("stripe-evt_log_fail");
      // The "done" mark must not be written when the delivery record failed.
      expect(storeIdempotencyKey).not.toHaveBeenCalled();
    });

    it("keeps a refunded payment refunded when a late payment_intent.succeeded arrives (BILL-P2-007)", async () => {
      mockStripeEvent({
        type: "payment_intent.succeeded",
        id: "evt_pi_late",
        data: {
          object: {
            id: "pi_refunded",
            customer: "cus_1",
            invoice: null,
            amount: 55000,
            amount_received: 55000,
            currency: "usd",
            status: "succeeded",
            created: 1700000000,
          },
        },
      });

      const supabaseModule = await import("../services/supabase");
      const { supabase, builders } = mockSupabaseWithBuilders({
        billing_customers: { data: { organization_id: "org-1" }, error: null },
        payments: { data: { status: "refunded" }, error: null },
      });
      (supabaseModule.getSupabaseAdmin as jest.Mock).mockReturnValueOnce(supabase);

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "payment_intent.succeeded", id: "evt_pi_late" });

      expect(res.status).toBe(200);
      expect(builders["payments"].upsert).not.toHaveBeenCalled();
    });

    it("keeps a void invoice void when a late invoice.paid arrives (BILL-P2-007)", async () => {
      mockStripeEvent({
        type: "invoice.paid",
        id: "evt_inv_late",
        data: {
          object: {
            customer: "cus_1",
            id: "in_void",
            number: "INV-9001",
            status: "paid",
            subtotal: 500,
            tax: 0,
            total: 500,
            currency: "usd",
            hosted_invoice_url: null,
            invoice_pdf: null,
            due_date: null,
            status_transitions: { paid_at: 1700000000 },
          },
        },
      });

      const supabaseModule = await import("../services/supabase");
      const { supabase, builders } = mockSupabaseWithBuilders({
        billing_customers: { data: { organization_id: "org-1" }, error: null },
        invoices: { data: { status: "void" }, error: null },
      });
      (supabaseModule.getSupabaseAdmin as jest.Mock).mockReturnValueOnce(supabase);

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "invoice.paid", id: "evt_inv_late" });

      expect(res.status).toBe(200);
      expect(builders["invoices"].upsert).not.toHaveBeenCalled();
    });

    it("keeps a canceled subscription canceled when a late subscription.updated arrives (BILL-P2-007)", async () => {
      mockStripeEvent({
        type: "customer.subscription.updated",
        id: "evt_sub_late",
        data: {
          object: {
            id: "sub_1",
            customer: "cus_1",
            status: "active",
            items: { data: [{ price: { nickname: "Pro", unit_amount: 1000, currency: "usd" } }] },
            current_period_start: 1700000000,
            current_period_end: 1702592000,
          },
        },
      });

      const supabaseModule = await import("../services/supabase");
      const { supabase, builders } = mockSupabaseWithBuilders({
        billing_customers: { data: { organization_id: "org-1" }, error: null },
        subscriptions: { data: { status: "canceled" }, error: null },
      });
      (supabaseModule.getSupabaseAdmin as jest.Mock).mockReturnValueOnce(supabase);

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "customer.subscription.updated", id: "evt_sub_late" });

      expect(res.status).toBe(200);
      expect(builders["subscriptions"].upsert).not.toHaveBeenCalled();
    });

    it("mirrors the trial, interval and cancellation lifecycle on customer.subscription.updated (BILL-P2-001/P2-005)", async () => {
      mockStripeEvent({
        type: "customer.subscription.updated",
        id: "evt_sub_1",
        data: {
          object: {
            id: "sub_123",
            customer: "cus_1",
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
                  quantity: 5,
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
        },
      });

      const supabaseModule = await import("../services/supabase");
      const { supabase, builders } = mockSupabaseWithBuilders({
        billing_customers: { data: { organization_id: "org-1" }, error: null },
      });
      (supabaseModule.getSupabaseAdmin as jest.Mock).mockReturnValueOnce(supabase);

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "customer.subscription.updated", id: "evt_sub_1" });

      expect(res.status).toBe(200);
      const upsertArgs = builders["subscriptions"].upsert.mock.calls[0][0];
      expect(upsertArgs.status).toBe("trialing");
      expect(upsertArgs.interval).toBe("month");
      expect(upsertArgs.trial_start).toBe(new Date(1700000000 * 1000).toISOString());
      expect(upsertArgs.trial_end).toBe(new Date(1701000000 * 1000).toISOString());
      expect(upsertArgs.cancel_at_period_end).toBe(true);
      expect(upsertArgs.canceled_at).toBeNull();
      expect(upsertArgs.quantity).toBe(5);
    });

    it("persists canceled_at when a subscription is deleted (BILL-P2-001)", async () => {
      mockStripeEvent({
        type: "customer.subscription.deleted",
        id: "evt_sub_del",
        data: {
          object: {
            id: "sub_canceled",
            customer: "cus_1",
            status: "canceled",
            current_period_start: 1700000000,
            current_period_end: 1702592000,
            trial_start: null,
            trial_end: null,
            cancel_at_period_end: false,
            canceled_at: 1702000000,
            items: { data: [{ quantity: 1, price: { nickname: "Pro" } }] },
          },
        },
      });

      const supabaseModule = await import("../services/supabase");
      const { supabase, builders } = mockSupabaseWithBuilders({
        billing_customers: { data: { organization_id: "org-1" }, error: null },
      });
      (supabaseModule.getSupabaseAdmin as jest.Mock).mockReturnValueOnce(supabase);

      const res = await request(app)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({ type: "customer.subscription.deleted", id: "evt_sub_del" });

      expect(res.status).toBe(200);
      const upsertArgs = builders["subscriptions"].upsert.mock.calls[0][0];
      expect(upsertArgs.status).toBe("canceled");
      expect(upsertArgs.canceled_at).toBe(new Date(1702000000 * 1000).toISOString());
      expect(upsertArgs.cancel_at_period_end).toBe(false);
      expect(upsertArgs.trial_end).toBeNull();
    });
  });

  describe("POST /jira", () => {
    it("processes a Jira webhook", async () => {
      const res = await request(app)
        .post("/api/v1/webhooks/jira")
        .set("x-hub-signature", "sig_123")
        .send({
          webhookEvent: "issue_created",
          issue: {
            key: "PROJ-123",
            fields: { status: { name: "To Do" }, summary: "Test issue" },
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("returns 401 when signature header missing", async () => {
      const res = await request(app)
        .post("/api/v1/webhooks/jira")
        .send({
          webhookEvent: "issue_updated",
          issue: {
            key: "PROJ-456",
            fields: { status: { name: "Done" }, summary: "Closed issue" },
          },
        });

      expect(res.status).toBe(401);
    });

    it("returns 401 with invalid signature", async () => {
      const { verifyWebhookSignature } = await import("../lib/webhook-signature");
      (verifyWebhookSignature as jest.Mock).mockReturnValueOnce(false);

      const res = await request(app)
        .post("/api/v1/webhooks/jira")
        .set("x-hub-signature", "bad_sig")
        .send({
          webhookEvent: "issue_updated",
          issue: {
            key: "PROJ-456",
            fields: { status: { name: "Done" }, summary: "Closed issue" },
          },
        });

      expect(res.status).toBe(401);
    });

    it("fails closed when the raw body is unavailable [WH-P2-004]", async () => {
      const { rawBodyBuffer, verifyWebhookSignature } = await import(
        "../lib/webhook-signature"
      );
      (rawBodyBuffer as jest.Mock).mockReturnValueOnce(null);
      (verifyWebhookSignature as jest.Mock).mockClear();

      const res = await request(app)
        .post("/api/v1/webhooks/jira")
        .set("x-hub-signature", "sig_123")
        .send({
          webhookEvent: "issue_updated",
          issue: {
            key: "PROJ-456",
            fields: { status: { name: "Done" }, summary: "Closed issue" },
          },
        });

      expect(res.status).toBe(401);
      // Never verify a re-serialized body — fail before the HMAC comparison.
      expect(verifyWebhookSignature).not.toHaveBeenCalled();
    });
  });

  describe("POST /jsm", () => {
    it("processes a JSM webhook", async () => {
      const res = await request(app)
        .post("/api/v1/webhooks/jsm")
        .set("x-hub-signature", "sig_123")
        .send({
          webhookEvent: "customer_added",
          issue: {
            key: "HELP-1",
            fields: { status: { name: "Open" }, summary: "Test JSM issue" },
          },
          organizationId: "00000000-0000-0000-0000-000000000001",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("fails closed when the raw body is unavailable [WH-P2-004]", async () => {
      const { rawBodyBuffer, verifyWebhookSignature } = await import(
        "../lib/webhook-signature"
      );
      (rawBodyBuffer as jest.Mock).mockReturnValueOnce(null);
      (verifyWebhookSignature as jest.Mock).mockClear();

      const res = await request(app)
        .post("/api/v1/webhooks/jsm")
        .set("x-hub-signature", "sig_123")
        .send({
          webhookEvent: "customer_added",
          issue: {
            key: "HELP-1",
            fields: { status: { name: "Open" }, summary: "Test JSM issue" },
          },
          organizationId: "00000000-0000-0000-0000-000000000001",
        });

      expect(res.status).toBe(401);
      expect(verifyWebhookSignature).not.toHaveBeenCalled();
    });
  });

  describe("POST /m365", () => {
    it("processes an M365 webhook", async () => {
      const res = await request(app)
        .post("/api/v1/webhooks/m365")
        .send({
          value: [
            {
              resource: "users",
              changeType: "updated",
              clientState: "m365-client-state",
              subscriptionId: "sub-123",
              subscriptionExpirationDateTime: "2026-08-01T00:00:00Z",
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("rejects M365 webhook with wrong clientState", async () => {
      const res = await request(app)
        .post("/api/v1/webhooks/m365")
        .send({
          value: [
            {
              resource: "users",
              changeType: "updated",
              clientState: "wrong-state",
            },
          ],
        });

      expect(res.status).toBe(401);
    });

    it("rejects M365 webhook with missing clientState (unauthenticated spoof)", async () => {
      const res = await request(app)
        .post("/api/v1/webhooks/m365")
        .send({
          value: [
            {
              resource: "users",
              changeType: "updated",
            },
          ],
        });

      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe("UNAUTHORIZED");
    });

    it("rejects M365 webhook when clientState omitted from all notifications", async () => {
      const res = await request(app)
        .post("/api/v1/webhooks/m365")
        .send({
          value: [
            { resource: "users", changeType: "created" },
            { resource: "users", changeType: "updated" },
          ],
        });

      expect(res.status).toBe(401);
    });

    it("uses event-unique dedup keys so legit repeated events are not dropped", async () => {
      const { claimIdempotencyKey } = await import("../lib/idempotency");
      (claimIdempotencyKey as jest.Mock).mockClear();

      await request(app)
        .post("/api/v1/webhooks/m365")
        .send({
          value: [
            {
              resource: "users/abc",
              changeType: "updated",
              clientState: "m365-client-state",
              subscriptionExpirationDateTime: "2026-08-01T00:00:00Z",
              resourceData: { id: "abc" },
            },
          ],
        });
      const firstKey = (claimIdempotencyKey as jest.Mock).mock.calls[0][0] as string;

      (claimIdempotencyKey as jest.Mock).mockClear();
      await request(app)
        .post("/api/v1/webhooks/m365")
        .send({
          value: [
            {
              resource: "users/def",
              changeType: "updated",
              clientState: "m365-client-state",
              subscriptionExpirationDateTime: "2026-08-01T00:00:00Z",
              resourceData: { id: "def" },
            },
          ],
        });
      const secondKey = (claimIdempotencyKey as jest.Mock).mock.calls[0][0] as string;

      expect(firstKey).toMatch(/^m365-/);
      expect(secondKey).toMatch(/^m365-/);
      expect(firstKey).not.toBe(secondKey);
    });

    it("bounds replay with the 7-day idempotency window [WH-P2-001]", async () => {
      const { claimIdempotencyKey } = await import("../lib/idempotency");
      (claimIdempotencyKey as jest.Mock).mockClear();

      const res = await request(app)
        .post("/api/v1/webhooks/m365")
        .send({
          value: [
            {
              resource: "users/ttl",
              changeType: "updated",
              clientState: "m365-client-state",
              subscriptionExpirationDateTime: "2026-08-01T00:00:00Z",
              resourceData: { id: "ttl" },
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(claimIdempotencyKey).toHaveBeenCalled();
      // Third argument is the TTL in seconds: the enforced replay window.
      expect((claimIdempotencyKey as jest.Mock).mock.calls[0][2]).toBe(7 * 24 * 60 * 60);
    });
  });

  describe("inbound payload caps and schemas [WH-P2-006]", () => {
    it("rejects a Stripe body over the 1mb provider cap with 413", async () => {
      const res = await request(cappedApp)
        .post("/api/v1/webhooks/stripe")
        .set("stripe-signature", "sig_123")
        .send({
          id: "evt_big",
          type: "checkout.session.completed",
          padding: "x".repeat(1024 * 1024 + 1024),
        });

      expect(res.status).toBe(413);
      expect(res.body.error?.code).toBe("PAYLOAD_TOO_LARGE");
    });

    it("rejects an M365 body over its 256kb provider cap with 413", async () => {
      const res = await request(cappedApp)
        .post("/api/v1/webhooks/m365")
        .send({
          value: [{ clientState: "m365-client-state", padding: "x".repeat(300 * 1024) }],
        });

      expect(res.status).toBe(413);
      expect(res.body.error?.code).toBe("PAYLOAD_TOO_LARGE");
    });

    it("rejects a malformed Jira payload with 400 before signature verification", async () => {
      const { verifyWebhookSignature } = await import("../lib/webhook-signature");
      (verifyWebhookSignature as jest.Mock).mockClear();

      const res = await request(cappedApp)
        .post("/api/v1/webhooks/jira")
        .set("x-hub-signature", "sig_123")
        .send([{ webhookEvent: "issue_created" }]);

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe("VALIDATION");
      // The schema gate runs before the HMAC comparison (WH-P2-006).
      expect(verifyWebhookSignature).not.toHaveBeenCalled();
    });

    it("rejects an M365 payload whose value is not a non-empty array with 400", async () => {
      const res = await request(cappedApp)
        .post("/api/v1/webhooks/m365")
        .send({ value: "not-an-array" });

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe("VALIDATION");
    });

    it("still accepts a valid payload under the cap", async () => {
      const res = await request(cappedApp)
        .post("/api/v1/webhooks/jira")
        .set("x-hub-signature", "sig_123")
        .send({
          webhookEvent: "issue_created",
          issue: { key: "PROJ-1", fields: { status: { name: "To Do" }, summary: "ok" } },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("GET /m365", () => {
    it("echoes validationToken for Microsoft Graph subscription validation", async () => {
      const res = await request(app)
        .get("/api/v1/webhooks/m365?validationToken=abc123");

      expect(res.status).toBe(200);
      expect(res.text).toBe("abc123");
    });

    it("returns 400 when validationToken is missing", async () => {
      const res = await request(app).get("/api/v1/webhooks/m365");

      expect(res.status).toBe(400);
    });
  });
});
