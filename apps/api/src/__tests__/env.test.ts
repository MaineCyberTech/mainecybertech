import {
  assertProductionSecrets,
  assertQueueBackendParity,
  getEnv,
  hasWildcardCorsOrigin,
} from "../config/env";

describe("env production boot assertions [SEC-P1-001]", () => {
  it("accepts a 64-char hex key in production", () => {
    expect(() =>
      assertProductionSecrets({ NODE_ENV: "production", FIELD_ENCRYPTION_KEY: "a".repeat(64) }),
    ).not.toThrow();
  });

  it("accepts a base64-encoded 32-byte key in production", () => {
    const key = Buffer.alloc(32, 7).toString("base64");
    expect(() =>
      assertProductionSecrets({ NODE_ENV: "production", FIELD_ENCRYPTION_KEY: key }),
    ).not.toThrow();
  });

  it("throws at boot when production has no key", () => {
    expect(() =>
      assertProductionSecrets({ NODE_ENV: "production", FIELD_ENCRYPTION_KEY: undefined }),
    ).toThrow(/FIELD_ENCRYPTION_KEY/);
  });

  it("throws at boot when the production key is the wrong length", () => {
    expect(() =>
      assertProductionSecrets({ NODE_ENV: "production", FIELD_ENCRYPTION_KEY: "not-32-bytes" }),
    ).toThrow(/FIELD_ENCRYPTION_KEY/);
  });

  it("does not require the key outside production", () => {
    expect(() =>
      assertProductionSecrets({ NODE_ENV: "development", FIELD_ENCRYPTION_KEY: undefined }),
    ).not.toThrow();
    expect(() =>
      assertProductionSecrets({ NODE_ENV: "test", FIELD_ENCRYPTION_KEY: undefined }),
    ).not.toThrow();
  });
});

describe("CORS wildcard rejection [SEC-P3-006]", () => {
  it("flags a wildcard in any allowlist position", () => {
    expect(hasWildcardCorsOrigin("*")).toBe(true);
    expect(hasWildcardCorsOrigin("*,https://app.example.com")).toBe(true);
    expect(hasWildcardCorsOrigin("https://app.example.com, *")).toBe(true);
    expect(hasWildcardCorsOrigin("https://app.example.com,https://www.example.com")).toBe(false);
    expect(hasWildcardCorsOrigin("")).toBe(false);
  });

  it("rejects CORS_ORIGIN=* at boot (the API always sends credentials)", () => {
    const saved = {
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      JWT_SECRET: process.env.JWT_SECRET,
    };
    process.env.CORS_ORIGIN = "*";
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-zod";
    try {
      expect(() => getEnv()).toThrow(/CORS_ORIGIN/);
    } finally {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});

describe("env queue backend parity assertion [ARCH-P2-004]", () => {
  it("accepts bullmq in production", () => {
    expect(() =>
      assertQueueBackendParity({ NODE_ENV: "production", QUEUE_BACKEND: "bullmq" }),
    ).not.toThrow();
  });

  it("throws at boot when production is on sqs", () => {
    expect(() =>
      assertQueueBackendParity({ NODE_ENV: "production", QUEUE_BACKEND: "sqs" }),
    ).toThrow(/QUEUE_BACKEND/);
  });

  it("throws at boot when production is on inline", () => {
    expect(() =>
      assertQueueBackendParity({ NODE_ENV: "production", QUEUE_BACKEND: "inline" }),
    ).toThrow(/QUEUE_BACKEND/);
  });

  it("allows the non-production alternatives outside production", () => {
    for (const backend of ["sqs", "inline"] as const) {
      expect(() =>
        assertQueueBackendParity({ NODE_ENV: "development", QUEUE_BACKEND: backend }),
      ).not.toThrow();
      expect(() =>
        assertQueueBackendParity({ NODE_ENV: "test", QUEUE_BACKEND: backend }),
      ).not.toThrow();
    }
  });
});
