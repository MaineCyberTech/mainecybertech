import {
  CODE_COUNT,
  findMatchingRecoveryCode,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
} from "../lib/mfa-recovery";

const CODE_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/;

describe("mfa-recovery", () => {
  describe("generateRecoveryCodes", () => {
    it("generates CODE_COUNT formatted codes by default", () => {
      const codes = generateRecoveryCodes();
      expect(codes).toHaveLength(CODE_COUNT);
      for (const code of codes) {
        expect(code).toMatch(CODE_RE);
      }
    });

    it("honours a custom count", () => {
      expect(generateRecoveryCodes(3)).toHaveLength(3);
    });

    it("generates distinct codes", () => {
      const codes = generateRecoveryCodes();
      expect(new Set(codes).size).toBe(codes.length);
    });

    it("excludes ambiguous characters (0, 1, I, O)", () => {
      const codes = generateRecoveryCodes(50).join("");
      expect(codes).not.toMatch(/[01IO]/);
    });
  });

  describe("hashRecoveryCode / verifyRecoveryCode", () => {
    it("verifies the original code", async () => {
      const code = generateRecoveryCodes(1)[0];
      const { hash, salt } = await hashRecoveryCode(code);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(salt).toMatch(/^[0-9a-f]{32}$/);
      expect(await verifyRecoveryCode(code, hash, salt)).toBe(true);
    });

    it("rejects a different code", async () => {
      const [code, other] = generateRecoveryCodes(2);
      const { hash, salt } = await hashRecoveryCode(code);
      expect(await verifyRecoveryCode(other, hash, salt)).toBe(false);
    });

    it("rejects the correct code with the wrong salt", async () => {
      const code = generateRecoveryCodes(1)[0];
      const { hash } = await hashRecoveryCode(code);
      const { salt: otherSalt } = await hashRecoveryCode(code);
      expect(await verifyRecoveryCode(code, hash, otherSalt)).toBe(false);
    });

    it("normalizes lowercase and whitespace", async () => {
      const code = generateRecoveryCodes(1)[0];
      const { hash, salt } = await hashRecoveryCode(code);
      const lower = code.toLowerCase();
      const spaced = `  ${lower.slice(0, 5)} ${lower.slice(6)}  `;
      expect(await verifyRecoveryCode(lower, hash, salt)).toBe(true);
      expect(await verifyRecoveryCode(spaced, hash, salt)).toBe(true);
    });

    it("produces a different hash for the same code (random salt)", async () => {
      const code = generateRecoveryCodes(1)[0];
      const first = await hashRecoveryCode(code);
      const second = await hashRecoveryCode(code);
      expect(first.salt).not.toBe(second.salt);
      expect(first.hash).not.toBe(second.hash);
    });

    it("returns false for a malformed stored hash", async () => {
      const code = generateRecoveryCodes(1)[0];
      expect(await verifyRecoveryCode(code, "", "abcd")).toBe(false);
      expect(await verifyRecoveryCode(code, "zzzz", "abcd")).toBe(false);
    });
  });

  describe("findMatchingRecoveryCode", () => {
    it("returns the matching row from a batch", async () => {
      const codes = generateRecoveryCodes(3);
      const rows = await Promise.all(
        codes.map(async (code, index) => ({
          id: String(index),
          ...(await hashRecoveryCode(code)),
        })),
      );
      const match = await findMatchingRecoveryCode(
        codes[1],
        rows.map((row) => ({ id: row.id, code_hash: row.hash, salt: row.salt })),
      );
      expect(match?.id).toBe("1");
    });

    it("returns null when nothing matches", async () => {
      const [code, other] = generateRecoveryCodes(2);
      const { hash, salt } = await hashRecoveryCode(code);
      expect(await findMatchingRecoveryCode(other, [{ code_hash: hash, salt }])).toBeNull();
    });
  });
});
