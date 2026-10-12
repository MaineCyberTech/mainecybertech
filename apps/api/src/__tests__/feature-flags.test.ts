import { jest } from "@jest/globals";

/**
 * EVOL-P3-001: the flag registry is typed, targetable, and change-logged.
 * These tests pin the resolution precedence and the audit event so a future
 * refactor cannot silently drop the structure again.
 */

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
}));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn().mockResolvedValue(true) }));

import { logAuditEvent } from "../services/audit";
import {
  FEATURE_FLAG_KEYS,
  FEATURE_FLAGS,
  clearFeatureFlagOverride,
  featureFlagBucket,
  getFeatureFlagChangeLog,
  getFeatureFlags,
  isFeatureEnabled,
  resetFeatureFlagStateForTests,
  setFeatureFlagOverride,
} from "../lib/feature-flags";

const ORG_A = "00000000-0000-0000-0000-00000000000a";
const ORG_B = "00000000-0000-0000-0000-00000000000b";

const ENV_KEYS = [
  "FEATURE_NEW_ONBOARDING",
  "FEATURE_NEW_ONBOARDING_ORGS",
  "FEATURE_NEW_ONBOARDING_PERCENT",
  "FEATURE_SSE_NOTIFICATIONS",
];

function clearEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

describe("feature flags (EVOL-P3-001)", () => {
  beforeEach(() => {
    resetFeatureFlagStateForTests();
    clearEnv();
    jest.clearAllMocks();
  });
  afterEach(() => {
    resetFeatureFlagStateForTests();
    clearEnv();
  });

  it("registers every flag with description, default and owner", () => {
    expect(FEATURE_FLAG_KEYS.length).toBeGreaterThan(0);
    for (const key of FEATURE_FLAG_KEYS) {
      expect(typeof FEATURE_FLAGS[key].description).toBe("string");
      expect(typeof FEATURE_FLAGS[key].default).toBe("boolean");
      expect(FEATURE_FLAGS[key].owner.startsWith("@")).toBe(true);
    }
  });

  it("falls back to the registry default", () => {
    expect(isFeatureEnabled("new-onboarding")).toBe(false);
    expect(isFeatureEnabled("sse-notifications")).toBe(true);
    expect(getFeatureFlags()).toEqual({
      "new-onboarding": false,
      "bulk-export-v2": false,
      "sse-notifications": true,
      "store-catalog": true,
    });
  });

  it("throws for unknown keys instead of silently defaulting", () => {
    // The old implementation returned `false` for any typo.
    expect(() => isFeatureEnabled("not-a-flag" as never)).toThrow(/Unknown feature flag/);
  });

  it("honors the global env override", () => {
    process.env.FEATURE_NEW_ONBOARDING = "true";
    expect(isFeatureEnabled("new-onboarding")).toBe(true);
    process.env.FEATURE_SSE_NOTIFICATIONS = "0";
    expect(isFeatureEnabled("sse-notifications")).toBe(false);
  });

  it("targets an explicit org allow-list", () => {
    process.env.FEATURE_NEW_ONBOARDING_ORGS = `${ORG_A}, ${ORG_B}`;
    expect(isFeatureEnabled("new-onboarding", { organizationId: ORG_A })).toBe(true);
    expect(isFeatureEnabled("new-onboarding", { organizationId: ORG_B })).toBe(true);
    expect(isFeatureEnabled("new-onboarding", { organizationId: "other-org" })).toBe(false);
    // No org context: allow-list cannot apply, registry default wins.
    expect(isFeatureEnabled("new-onboarding")).toBe(false);
  });

  it("rolls out a percentage deterministically per org", () => {
    process.env.FEATURE_NEW_ONBOARDING_PERCENT = "50";
    const first = isFeatureEnabled("new-onboarding", { organizationId: ORG_A });
    expect(isFeatureEnabled("new-onboarding", { organizationId: ORG_A })).toBe(first);
    expect(featureFlagBucket("new-onboarding", ORG_A)).toBe(
      featureFlagBucket("new-onboarding", ORG_A),
    );
    expect(featureFlagBucket("new-onboarding", ORG_A)).toBeLessThan(100);
    process.env.FEATURE_NEW_ONBOARDING_PERCENT = "0";
    expect(isFeatureEnabled("new-onboarding", { organizationId: ORG_A })).toBe(false);
    process.env.FEATURE_NEW_ONBOARDING_PERCENT = "100";
    expect(isFeatureEnabled("new-onboarding", { organizationId: ORG_A })).toBe(true);
  });

  it("runtime override wins over env and records a change + audit event", async () => {
    process.env.FEATURE_NEW_ONBOARDING = "false";
    const change = await setFeatureFlagOverride("new-onboarding", true, {
      actorUserId: "user-1",
      organizationId: ORG_A,
      reason: "pilot",
    });
    expect(isFeatureEnabled("new-onboarding")).toBe(true);
    expect(change).toMatchObject({
      key: "new-onboarding",
      previous: undefined,
      next: true,
      source: "override",
      actorUserId: "user-1",
      reason: "pilot",
    });
    expect(getFeatureFlagChangeLog()).toHaveLength(1);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "feature_flag.changed",
        entityType: "feature_flag",
        entityId: "new-onboarding",
      }),
    );
  });

  it("clearing an override restores env/default resolution and logs it", async () => {
    await setFeatureFlagOverride("new-onboarding", true, { actorUserId: "user-1" });
    await clearFeatureFlagOverride("new-onboarding", { actorUserId: "user-1", reason: "rollback" });
    expect(isFeatureEnabled("new-onboarding")).toBe(false);
    const log = getFeatureFlagChangeLog();
    expect(log).toHaveLength(2);
    expect(log[1]).toMatchObject({ source: "clear", previous: true, next: undefined });
    expect(logAuditEvent).toHaveBeenCalledTimes(2);
  });

  it("rejects unknown keys on override", async () => {
    await expect(setFeatureFlagOverride("nope" as never, true)).rejects.toThrow(
      /Unknown feature flag/,
    );
  });
});
