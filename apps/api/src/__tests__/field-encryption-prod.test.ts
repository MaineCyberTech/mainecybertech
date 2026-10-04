import { jest } from "@jest/globals";

// Production environment WITHOUT FIELD_ENCRYPTION_KEY. The remediation moved
// the boot gate to config/env (assertProductionSecrets, covered by
// env.test.ts); lib/field-encryption itself must still refuse to WRITE
// reversible `plain:` PII in production (SEC-P1-001).
jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "production",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  }),
}));

jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe("field-encryption production fail-closed (SEC-P1-001)", () => {
  it("loads but refuses to encrypt without FIELD_ENCRYPTION_KEY", async () => {
    const mod = await import("../lib/field-encryption");
    expect(() => mod.encryptField("jane@example.com")).toThrow(/FIELD_ENCRYPTION_KEY/);
  });
});
