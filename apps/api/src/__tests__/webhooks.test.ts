import { jest } from "@jest/globals";
import request from "supertest";
import webhooksRouter from "../routes/webhooks";
import { createTestApp, createMockBuilder, type MockResult } from "./helpers";
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
  });

  describe("POST /jira", () => {
    it.skip("processes a Jira webhook", async () => {
      const res = await request(app)
        .post("/api/v1/webhooks/jira")
        .send({
          webhookEvent: "issue_created",
          issue: {
            key: "PROJ-123",
            fields: { status: { name: "To Do" }, summary: "Test issue" },
          },
        });

      expect(res.status).toBe(200);
    });
  });

  describe("POST /jsm", () => {
    it.skip("processes a JSM webhook", async () => {
      const res = await request(app)
        .post("/api/v1/webhooks/jsm")
        .send({
          webhookEvent: "customer_added",
          issue: {
            key: "HELP-1",
            fields: { status: { name: "Open" }, summary: "Test JSM issue" },
          },
          organizationId: "org-1",
        });

      expect(res.status).toBe(200);
    });
  });

  describe("POST /m365", () => {
    it.skip("processes an M365 webhook", async () => {
      const res = await request(app)
        .post("/api/v1/webhooks/m365")
        .send({ resource: "users", changeType: "updated" });

      expect(res.status).toBe(200);
    });
  });
});
