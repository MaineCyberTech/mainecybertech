import { jest } from "@jest/globals";

// Production environment WITHOUT FIELD_ENCRYPTION_KEY: the module must refuse
// to load so the API can never start writing reversible `plain:` PII
// (SEC-P1-001).
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

describe("field-encryption production boot guard", () => {
  it("refuses to load without FIELD_ENCRYPTION_KEY (SEC-P1-001)", async () => {
    let error: unknown;
    try {
      await import("../lib/field-encryption");
    } catch (e) {
      error = e;
    }
    expect(String(error)).toMatch(/FIELD_ENCRYPTION_KEY/);
  });
});
