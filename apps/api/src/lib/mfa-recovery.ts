/**
 * MFA recovery codes.
 *
 * GoTrue TOTP has no backup codes of its own, so the portal stores its own:
 * a batch of single-use codes kept only as scrypt hashes. Spending one is a
 * lost-device fallback — the API deletes every other code and unenrolls the
 * user's verified TOTP factors (there is no way to mint an `aal2` session
 * without a factor verification), so the user regains access and re-enrolls.
 *
 * Codes are 50-bit random values, so a memory-hard hash with a reduced cost
 * (`N=8192`) is sufficient: a full batch miss is verified in parallel on the
 * libuv threadpool and stays well under a second.
 */
import { randomBytes, scrypt, timingSafeEqual } from "crypto";

export const CODE_COUNT = 10;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 10;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const SCRYPT_OPTIONS = { N: 8192, r: 8, p: 1 };

function normalizeRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function deriveKey(code: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(normalizeRecoveryCode(code), salt, KEY_BYTES, SCRYPT_OPTIONS, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/** Generates `count` codes formatted `XXXXX-XXXXX` from an unambiguous alphabet. */
export function generateRecoveryCodes(count = CODE_COUNT): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(CODE_LENGTH);
    let raw = "";
    for (let j = 0; j < CODE_LENGTH; j++) {
      // The alphabet is 32 chars and 32 divides 256 evenly, so no modulo bias.
      raw += CODE_ALPHABET[bytes[j] % CODE_ALPHABET.length];
    }
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
}

/** Hashes a code with a fresh 16-byte salt (stored hex-encoded). */
export async function hashRecoveryCode(code: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const hash = (await deriveKey(code, salt)).toString("hex");
  return { hash, salt };
}

/** Constant-time comparison against a stored scrypt hash. */
export async function verifyRecoveryCode(
  code: string,
  hash: string,
  salt: string,
): Promise<boolean> {
  try {
    const expected = Buffer.from(hash, "hex");
    if (expected.length !== KEY_BYTES) return false;
    const actual = await deriveKey(code, salt);
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/** Verifies a candidate code against every stored hash in parallel. */
export async function findMatchingRecoveryCode<T extends { code_hash: string; salt: string }>(
  code: string,
  rows: T[],
): Promise<T | null> {
  const matches = await Promise.all(
    rows.map((row) => verifyRecoveryCode(code, row.code_hash, row.salt)),
  );
  const index = matches.findIndex(Boolean);
  return index === -1 ? null : rows[index];
}
