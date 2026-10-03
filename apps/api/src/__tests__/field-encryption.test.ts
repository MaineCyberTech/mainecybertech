import { jest } from "@jest/globals";
import { encryptField, decryptField, encryptObject, decryptObject } from "../lib/field-encryption";

jest.mock("../config/env", () => {
  const key = "a".repeat(64); // 32 bytes hex
  return {
    getEnv: jest.fn().mockReturnValue({
      NODE_ENV: "test",
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_ANON_KEY: "test-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
      CORS_ORIGIN: "*",
      LOG_LEVEL: "silent",
      API_PORT: 4000,
      FIELD_ENCRYPTION_KEY: key,
    }),
  };
});

jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe("field-encryption", () => {
  it("round-trips a string", () => {
    const enc = encryptField("jane.doe@example.com");
    expect(enc).not.toContain("jane.doe@example.com");
    expect(decryptField(enc)).toBe("jane.doe@example.com");
  });

  it("uses v1 envelope format", () => {
    expect(encryptField("secret")).toMatch(/^v1:/);
  });

  it("round-trips an object", () => {
    const obj = { full_name: "Jane Doe", email: "jane@example.com", age: 30 };
    const enc = encryptObject(obj);
    expect(enc.email).not.toBe("jane@example.com");
    expect(decryptObject(enc)).toEqual(obj);
  });
});
