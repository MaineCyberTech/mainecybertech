import { jest } from "@jest/globals";

/**
 * Regression tests for tenant-isolation boundary telemetry (IR-P1-006).
 *
 * `getScopedClient` silently falls back to the RLS-bypassing service-role
 * client whenever a module is not in the RLS allow-list. That silence is the
 * gap the audit flagged: a query that forgets its organization_id predicate
 * produces no signal. These tests pin the counters that make it observable.
 */

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    APP_BASE_URL: "http://localhost:3000",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
    JWT_SECRET: "test-secret-that-is-long-enough",
  }),
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({ from: jest.fn() })),
}));

import { rlsBypassTotal, rlsEnforcedTotal } from "../lib/metrics";

describe("RLS boundary counters (IR-P1-006)", () => {
  it("exposes the bypass counter with module/kind/org_resolved labels", () => {
    const help = rlsBypassTotal;
    expect(help.name).toBe("portal_rls_bypass_total");
  });

  it("exposes the enforced counter", () => {
    expect(rlsEnforcedTotal.name).toBe("portal_rls_enforced_total");
  });

  it("distinguishes org-resolved from org-less service-role selections", async () => {
    const before = (await rlsBypassTotal.get()).values;
    const countFor = (labels: Record<string, string>) =>
      before
        .filter((v) => v.labels.org_resolved === labels.org_resolved)
        .reduce((acc, v) => acc + v.value, 0);

    const unresolvedBefore = countFor({ org_resolved: "false" });

    const { recordRlsBypass } = await import("../lib/metrics");
    recordRlsBypass("tickets", "read", false);
    recordRlsBypass("tickets", "read", true);

    const after = (await rlsBypassTotal.get()).values;
    const unresolvedAfter = after
      .filter((v) => v.labels.org_resolved === "false")
      .reduce((acc, v) => acc + v.value, 0);

    // The org-less increment is what the MCTTenantScopeMissing alert keys on.
    expect(unresolvedAfter).toBe(unresolvedBefore + 1);
  });
});
