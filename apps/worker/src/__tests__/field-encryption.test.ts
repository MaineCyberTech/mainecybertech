import { jest } from "@jest/globals";
import { createCipheriv, randomBytes } from "crypto";
import { decryptField, decryptSecretValue } from "../lib/field-encryption";
import { env } from "../env";

jest.mock("../env", () => ({
  env: { NODE_ENV: "test", LOG_LEVEL: "silent", FIELD_ENCRYPTION_KEY: "b".repeat(64) },
}));

jest.mock("../logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

function encryptV1(payload: string): string {
  const key = Buffer.from("b".repeat(64), "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  return `v1:${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${enc.toString("base64")}`;
}

describe("worker field-encryption (webhook secrets)", () => {
  beforeEach(() => {
    env.FIELD_ENCRYPTION_KEY = "b".repeat(64);
  });

  it("decrypts a v1 payload written by the API helper", () => {
    const encrypted = encryptV1("outbound-signing-secret");
    expect(encrypted).not.toContain("outbound-signing-secret");
    expect(decryptField(encrypted)).toBe("outbound-signing-secret");
  });

  it("passes legacy plaintext through unchanged (backward compatible)", () => {
    expect(decryptField("legacy-plaintext-secret")).toBe("legacy-plaintext-secret");
    expect(decryptSecretValue("legacy-plaintext-secret")).toEqual({
      ok: true,
      value: "legacy-plaintext-secret",
    });
  });

  it("fails closed (no throw) when a v1 payload cannot be decrypted", () => {
    const result = decryptSecretValue("v1:AAAA:BBBB:CCCC");
    expect(result.ok).toBe(false);
  });

  it("fails closed when the key is missing for a v1 payload", () => {
    const encrypted = encryptV1("outbound-signing-secret");
    env.FIELD_ENCRYPTION_KEY = undefined;
    expect(decryptSecretValue(encrypted).ok).toBe(false);
    // Legacy plaintext still works without the key.
    expect(decryptSecretValue("legacy-plaintext-secret").ok).toBe(true);
  });
});
