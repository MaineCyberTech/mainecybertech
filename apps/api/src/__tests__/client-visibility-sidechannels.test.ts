import { jest } from "@jest/globals";
import request from "supertest";
import { createMockBuilder, createTestApp, type MockResult } from "./helpers";
import { errorHandler } from "../middleware/error";

/**
 * SEC-P1-011: client roles must not read internal comments/timeline through
 * the sibling /:id/comments and /:id/timeline endpoints. The parent detail
 * visibility predicate has to be applied there too, and internal comments
 * filtered for client viewers.
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
    SMTP_HOST: "",
    EMAIL_FROM: "noreply@test.local",
    SENTRY_DSN: "",
    STRIPE_SECRET_KEY: "",
    STRIPE_WEBHOOK_SECRET: "",
    PUBLIC_TRAFFIC_WEBHOOK_URL: "",
    PUBLIC_LEAD_WEBHOOK_URL: "",
    JSM_DOMAIN: "",
    JSM_EMAIL: "",
    JSM_API_TOKEN: "",
    JSM_SERVICEDESK_ID: "",
    JSM_REQUEST_TYPE_ID: "",
  }),
}));
jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));
jest.mock("../services/approvals", () => ({
  approveRequest: jest.fn(),
  rejectRequest: jest.fn(),
  cancelRequest: jest.fn(),
  addTimelineEvent: jest.fn(),
}));
jest.mock("../middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.authUser = { userId: "user-1", email: "client@example.com" };
    next();
  },
}));
jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (req: any, _res: unknown, next: () => void) => {
    const orgId = "00000000-0000-0000-0000-000000000001";
    req.orgScope = { orgId, explicit: true, platformAdmin: false, impersonation: false };
    req.orgId = orgId;
    req.query = { ...req.query, organization_id: orgId };
    next();
  },
}));
jest.mock("../middleware/permissions", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock("../middleware/entitlement", () => ({
  requireEntitlement: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  requireActiveSubscription: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  clearEntitlementCache: jest.fn(),
}));
jest.mock("../lib/client-visibility", () => ({
  isClientMember: jest.fn().mockResolvedValue(true),
  isClientVisible: jest.fn(
    async (_req: unknown, row: Record<string, unknown> | null | undefined) =>
      row?.visibility === "client_visible",
  ),
  applyClientVisibility: jest.fn(async (query: unknown) => ({ query })),
}));

import { getSupabaseAdmin } from "../services/supabase";
import approvalsRouter from "../routes/approvals";
import assetsRouter from "../routes/assets";
import findingsRouter from "../routes/findings";
import proposalsRouter from "../routes/proposals";

const ORG_A = "00000000-0000-0000-0000-000000000001";
const authToken = "Bearer test-token";

type Builders = Record<string, ReturnType<typeof createMockBuilder>>;

function mockTables(rows: Record<string, unknown>): Builders {
  const builders: Builders = {};
  const supabase = {
    from: jest.fn((table: string) => {
      const builder = createMockBuilder({
        data: rows[table] ?? [],
        error: null,
      } as MockResult);
      builders[table] = builder;
      return builder;
    }),
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return builders;
}

const app = createTestApp();
app.use("/api/v1/approvals", approvalsRouter);
app.use("/api/v1/assets", assetsRouter);
app.use("/api/v1/findings", findingsRouter);
app.use("/api/v1/proposals", proposalsRouter);
app.use(errorHandler);

const internalCases = [
  {
    path: "/api/v1/approvals/a1/comments",
    parentTable: "approval_requests",
    moduleKey: "approvals",
  },
  {
    path: "/api/v1/approvals/a1/timeline",
    parentTable: "approval_requests",
    moduleKey: "approvals",
  },
  { path: "/api/v1/assets/a1/comments", parentTable: "assets", moduleKey: "assets" },
  { path: "/api/v1/assets/a1/timeline", parentTable: "assets", moduleKey: "assets" },
  { path: "/api/v1/findings/f1/comments", parentTable: "findings", moduleKey: "findings" },
  { path: "/api/v1/findings/f1/timeline", parentTable: "findings", moduleKey: "findings" },
  {
    path: "/api/v1/proposals/p1/timeline",
    parentTable: "proposals",
    moduleKey: "proposals",
  },
] as const;

const clientVisibleCommentCases = [
  { path: "/api/v1/approvals/a1/comments", parentTable: "approval_requests" },
  { path: "/api/v1/assets/a1/comments", parentTable: "assets" },
  { path: "/api/v1/findings/f1/comments", parentTable: "findings" },
] as const;

describe("Client visibility on comments/timeline siblings (SEC-P1-011)", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(internalCases)(
    "returns 404 for an internal parent via $path",
    async ({ path, parentTable }) => {
      const builders = mockTables({
        [parentTable]: { id: "parent-1", organization_id: ORG_A, visibility: "internal" },
      });

      const res = await request(app).get(path).set("Authorization", authToken);

      expect(res.status).toBe(404);
      expect(builders.module_comments).toBeUndefined();
      expect(builders.module_timeline_events).toBeUndefined();
    },
  );

  it.each(clientVisibleCommentCases)(
    "filters internal comments for client viewers via $path",
    async ({ path, parentTable }) => {
      const builders = mockTables({
        [parentTable]: {
          id: "parent-1",
          organization_id: ORG_A,
          visibility: "client_visible",
        },
        module_comments: [{ id: "c1", body: "client-visible", is_internal: false }],
      });

      const res = await request(app).get(path).set("Authorization", authToken);

      expect(res.status).toBe(200);
      expect(builders.module_comments.eq).toHaveBeenCalledWith("is_internal", false);
    },
  );

  it("returns the timeline for a client-visible parent", async () => {
    mockTables({
      proposals: { id: "p1", organization_id: ORG_A, visibility: "client_visible" },
      module_timeline_events: [{ id: "t1", event_type: "published" }],
    });

    const res = await request(app)
      .get("/api/v1/proposals/p1/timeline")
      .set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([{ id: "t1", event_type: "published" }]);
  });
});
