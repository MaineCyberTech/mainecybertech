import { jest } from "@jest/globals";
import {
  encryptProfilePii,
  decryptProfilePii,
  decryptProfileRow,
  PROFILE_PII_FIELDS,
} from "../lib/profile-pii";
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

  describe("decryptProfileRow [SEC-P2-002]", () => {
    it("returns decrypted values instead of the plaintext mirror columns", () => {
      const row = {
        id: "p1",
        full_name: "Stale Plaintext",
        email: "stale@example.com",
        phone: "000",
        title: "Stale",
        encrypted_pii: encryptProfilePii(
          { full_name: "Jane Doe", email: "jane@example.com", phone: "555", title: "Engineer" },
          {},
        ),
      };

      const out = decryptProfileRow(row);

      expect(out.full_name).toBe("Jane Doe");
      expect(out.email).toBe("jane@example.com");
      expect(out.phone).toBe("555");
      expect(out.title).toBe("Engineer");
    });

    it("strips the encrypted_pii column from the response", () => {
      const out = decryptProfileRow({
        id: "p1",
        encrypted_pii: encryptProfilePii({ full_name: "Jane" }, {}),
      });

      expect("encrypted_pii" in out).toBe(false);
    });

    it("falls back to the plaintext columns for not-yet-backfilled rows", () => {
      const out = decryptProfileRow({
        id: "p1",
        full_name: "Legacy User",
        email: "legacy@example.com",
        phone: null,
        title: null,
        encrypted_pii: null,
      });

      expect(out.full_name).toBe("Legacy User");
      expect(out.email).toBe("legacy@example.com");
      expect(out.phone).toBeNull();
    });

    it("keeps non-PII columns untouched", () => {
      const out = decryptProfileRow({ id: "p1", avatar_url: "https://cdn/a.png" });
      expect(out.avatar_url).toBe("https://cdn/a.png");
    });
  });
});
