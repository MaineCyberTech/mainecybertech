import { jest } from "@jest/globals";
import { encryptProfilePii, decryptProfilePii, PROFILE_PII_FIELDS } from "../lib/profile-pii";
import { decryptObject } from "../lib/field-encryption";

jest.mock("../config/env", () => {
  const key = "a".repeat(64);
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

describe("profile-pii", () => {
  it("covers the expected PII fields", () => {
    expect([...PROFILE_PII_FIELDS].sort()).toEqual(["email", "full_name", "phone", "title"]);
  });

  it("encrypts the full PII field set via encryptObject", () => {
    const enc = encryptProfilePii(
      { full_name: "Jane Doe", email: "jane@example.com", phone: "123", title: "Engineer" },
      {},
    );
    expect(enc.full_name).not.toBe("Jane Doe");
    expect(enc.email).not.toBe("jane@example.com");
    expect(decryptObject(enc)).toEqual({
      full_name: "Jane Doe",
      email: "jane@example.com",
      phone: "123",
      title: "Engineer",
    });
  });

  it("merges changes over the current state", () => {
    const enc = encryptProfilePii(
      { full_name: "Old", email: "old@example.com", phone: null, title: "Eng" },
      { full_name: "New", phone: "555" },
    );
    expect(decryptObject(enc)).toEqual({
      full_name: "New",
      email: "old@example.com",
      phone: "555",
      title: "Eng",
    });
  });

  it("omits null or undefined values", () => {
    const enc = encryptProfilePii({ full_name: null, email: null, phone: null, title: null }, {});
    expect(Object.keys(enc)).toHaveLength(0);
  });

  it("uses the v1 envelope for every field", () => {
    const enc = encryptProfilePii({ full_name: "X", email: "e", phone: "p", title: "t" }, {});
    expect(enc.full_name).toMatch(/^v1:/);
    expect(enc.email).toMatch(/^v1:/);
    expect(enc.phone).toMatch(/^v1:/);
    expect(enc.title).toMatch(/^v1:/);
  });

  it("round-trips through decryptProfilePii", () => {
    const enc = encryptProfilePii({ full_name: "Jane", email: "jane@example.com", phone: "1", title: "Eng" }, {});
    expect(decryptProfilePii(enc)).toEqual({
      full_name: "Jane",
      email: "jane@example.com",
      phone: "1",
      title: "Eng",
    });
  });
});
