import { timingSafeCompare } from "../lib/timing-safe";

/**
 * SEC-P3-002: constant-time comparison used for the CSRF token and the M365
 * webhook `clientState`. The helper must be correct (and must not throw) for
 * equal values, mismatched values, and length mismatches.
 */
describe("timingSafeCompare", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeCompare("client-state-secret", "client-state-secret")).toBe(true);
  });

  it("returns false for different strings of equal length", () => {
    expect(timingSafeCompare("aaaaaaaa", "aaaaaaab")).toBe(false);
  });

  it("returns false for different lengths without throwing", () => {
    expect(timingSafeCompare("short", "a-much-longer-value")).toBe(false);
  });

  it("returns true for two empty strings", () => {
    expect(timingSafeCompare("", "")).toBe(true);
  });
});
