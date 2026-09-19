import { jest } from "@jest/globals";
import request from "supertest";
import webhooksRouter from "../routes/webhooks";
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
}));

jest.mock("../lib/webhook-signature", () => ({
  verifyWebhookSignature: jest.fn().mockReturnValue(true),
  validateWebhookTimestamp: jest.fn().mockReturnValue(true),
}));

jest.mock("../lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const app = createTestApp();
app.use("/api/v1/webhooks", webhooksRouter);
app.use(errorHandler);

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
