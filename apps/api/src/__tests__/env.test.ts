import { assertProductionSecrets, assertQueueBackendParity } from "../config/env";

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
