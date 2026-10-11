import { jest } from "@jest/globals";
import {
  encryptField,
  decryptField,
  decryptSecretValue,
  encryptObject,
  decryptObject,
} from "../lib/field-encryption";

const mockEnv: { current: Record<string, unknown> } = {
  current: {
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
    FIELD_ENCRYPTION_KEY: "a".repeat(64),
  },
};

jest.mock("../config/env", () => ({
  getEnv: () => mockEnv.current,
}));

jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe("field-encryption", () => {
  beforeEach(() => {
    mockEnv.current = {
      NODE_ENV: "test",
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_ANON_KEY: "test-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
      CORS_ORIGIN: "*",
      LOG_LEVEL: "silent",
      API_PORT: 4000,
      FIELD_ENCRYPTION_KEY: "a".repeat(64),
    };
  });

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

  it("throws in production when FIELD_ENCRYPTION_KEY is absent [SEC-P1-001]", () => {
    mockEnv.current = { NODE_ENV: "production", FIELD_ENCRYPTION_KEY: undefined };
    expect(() => encryptField("jane@example.com")).toThrow(/FIELD_ENCRYPTION_KEY/);
  });

  it("throws in production when FIELD_ENCRYPTION_KEY is the wrong length [SEC-P1-001]", () => {
    mockEnv.current = { NODE_ENV: "production", FIELD_ENCRYPTION_KEY: "not-32-bytes" };
    expect(() => encryptField("jane@example.com")).toThrow(/FIELD_ENCRYPTION_KEY/);
  });

  it("still encrypts in production with a valid 32-byte key [SEC-P1-001]", () => {
    mockEnv.current = { NODE_ENV: "production", FIELD_ENCRYPTION_KEY: "b".repeat(64) };
    const enc = encryptField("jane@example.com");
    expect(enc).toMatch(/^v1:/);
    expect(enc).not.toContain("jane@example.com");
    expect(decryptField(enc)).toBe("jane@example.com");
  });

  it("keeps the reversible plaintext fallback outside production [SEC-P1-001]", () => {
    mockEnv.current = { NODE_ENV: "development", FIELD_ENCRYPTION_KEY: undefined };
    expect(encryptField("dev-only")).toBe("plain:dev-only");
  });

  it("still reads legacy plaintext values without rewriting them [SEC-P1-001]", () => {
    expect(decryptField("plain:legacy-value")).toBe("legacy-value");
  });

  it("decryptSecretValue fails closed for a v1 payload without a key", () => {
    mockEnv.current = { NODE_ENV: "test", FIELD_ENCRYPTION_KEY: undefined };
    expect(decryptSecretValue("v1:AAAA:BBBB:CCCC")).toEqual({
      ok: false,
      error: expect.stringContaining("FIELD_ENCRYPTION_KEY"),
    });
  });

  it("decryptSecretValue decrypts v1 and passes legacy plaintext through", () => {
    expect(decryptSecretValue("legacy-plaintext-secret")).toEqual({
      ok: true,
      value: "legacy-plaintext-secret",
    });
    const enc = encryptField("rotated-webhook-secret");
    expect(decryptSecretValue(enc)).toEqual({ ok: true, value: "rotated-webhook-secret" });
  });
});
