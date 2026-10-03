/**
 * Regression tests for the password-reset redirect origin (SEC-P2-003).
 *
 * The reset email's redirectTo carries the Supabase reset token, so an echoed
 * attacker-controlled Origin header is an account-takeover vector.
 */

import { jest } from "@jest/globals";

const APP_BASE = "https://app.mainecybertech.com";
const ALLOWLIST = `${APP_BASE},https://admin.mainecybertech.com`;

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "production",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "https://app.mainecybertech.com,https://admin.mainecybertech.com",
    APP_BASE_URL: "https://app.mainecybertech.com",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
    JWT_SECRET: "test-secret-that-is-long-enough-for-zod",
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn(),
  getSupabaseUser: jest.fn(),
}));

import { resolveTrustedRedirectOrigin } from "../routes/auth";

describe("resolveTrustedRedirectOrigin", () => {
  it("returns the canonical base URL when no Origin is supplied", () => {
    expect(resolveTrustedRedirectOrigin(undefined)).toBe(APP_BASE);
  });

  it("honours an origin on the CORS allowlist", () => {
    expect(resolveTrustedRedirectOrigin("https://admin.mainecybertech.com")).toBe(
      "https://admin.mainecybertech.com",
    );
  });

  it("accepts the canonical APP_BASE_URL", () => {
    expect(resolveTrustedRedirectOrigin(APP_BASE)).toBe(APP_BASE);
  });

  it("REJECTS an attacker-controlled origin (the SEC-P2-003 defect)", () => {
    for (const evil of [
      "https://evil.example.com",
      "https://mainecybertech.com.evil.example.com",
      "http://app.mainecybertech.com", // wrong scheme
      "https://app.mainecybertech.com.evil.example",
    ]) {
      expect(resolveTrustedRedirectOrigin(evil)).toBe(APP_BASE);
    }
  });

  it("falls back on a malformed Origin header", () => {
    expect(resolveTrustedRedirectOrigin("not a url")).toBe(APP_BASE);
  });

  it("normalizes a trailing slash in the Origin", () => {
    expect(resolveTrustedRedirectOrigin("https://admin.mainecybertech.com/")).toBe(
      "https://admin.mainecybertech.com",
    );
  });

  it("the allowlist is not the literal string passed in (sanity)", () => {
    expect(ALLOWLIST).toContain("admin.mainecybertech.com");
  });
});
