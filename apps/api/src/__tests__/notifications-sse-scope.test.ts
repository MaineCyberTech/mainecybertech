import { jest } from "@jest/globals";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    JWT_SECRET: "test-jwt-secret",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    APP_BASE_URL: "http://localhost:3000",
  }),
}));

import { notificationInScope } from "../routes/notifications";

describe("SSE notification org assertion [MT-P2-004]", () => {
  const userId = "user-1";
  const row = { user_id: userId, organization_id: "org-1" };

  it("accepts the caller's row in the resolved org", () => {
    expect(notificationInScope(row, userId, "org-1")).toBe(true);
  });

  it("rejects a row from another org", () => {
    expect(notificationInScope(row, userId, "org-2")).toBe(false);
  });

  it("rejects another user's row even in the same org", () => {
    expect(notificationInScope({ ...row, user_id: "user-2" }, userId, "org-1")).toBe(false);
  });

  it("allows the caller's rows across orgs when no org is resolved (platform admin)", () => {
    expect(notificationInScope(row, userId, undefined)).toBe(true);
    expect(notificationInScope({ ...row, organization_id: "org-9" }, userId, undefined)).toBe(true);
  });
});
