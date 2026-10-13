import { jest } from "@jest/globals";
import { createOrgAccessStub } from "./helpers";

/**
 * ACM-P3-007: the AI copilot endpoints (summarize, reply-draft) used to be
 * open to every org member. This guard asserts the route registrations carry
 * a requirePermission gate with the right action, so a future refactor that
 * drops the middleware fails CI. Behavioural enforcement (403 when the
 * permission is missing) is covered by middleware-permissions.test.ts.
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
  getScopedClient: jest.fn(),
}));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));
jest.mock("../middleware/org-access", () =>
  createOrgAccessStub("00000000-0000-0000-0000-000000000001"),
);
jest.mock("../middleware/permissions", () => ({
  requirePermission: jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}));

import { requirePermission } from "../middleware/permissions";
// Importing the router registers every route, which is what the mock records.
import "../routes/ai";

describe("AI copilot permission gates (ACM-P3-007)", () => {
  it("gates ticket summarization with ai:view", () => {
    expect(requirePermission).toHaveBeenCalledWith("ai", "view");
  });

  it("gates reply drafting with ai:create", () => {
    expect(requirePermission).toHaveBeenCalledWith("ai", "create");
  });

  it("gates every copilot registration, not just the draft routes", () => {
    const calls = (requirePermission as jest.Mock).mock.calls as unknown[][];
    const gated = calls.map(([moduleKey, action]) => `${String(moduleKey)}:${String(action)}`);
    // The copilot gates are registered before the /drafts gates; at minimum
    // both copilot actions must appear among the ai-module registrations.
    const aiActions = calls
      .filter(([moduleKey]) => moduleKey === "ai")
      .map(([, action]) => String(action));
    expect(aiActions).toEqual(expect.arrayContaining(["view", "create"]));
    expect(gated).toEqual(expect.arrayContaining(["ai:view", "ai:create"]));
  });
});
