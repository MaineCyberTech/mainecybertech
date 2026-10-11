/**
 * NOTIF-P2-005: sensitivity filter for notification bodies and emails.
 *
 * Worker-side mirror of `apps/api/src/lib/notification-content.ts` (the worker
 * is a separate deployable and cannot import API source — same convention as
 * the preference resolver and dedup-key helpers). Ticket payloads and other
 * user-supplied text flow into `notifications.body` (plaintext, retained for
 * 90 days) and into email bodies; this is the single redaction pass for both
 * channels.
 *
 * `redactSensitiveContent` replaces credential-like values with `[redacted]`
 * and leaves ordinary prose untouched. It is deliberately conservative (a
 * false redaction is cheaper than a leaked secret) and idempotent, so it is
 * safe to apply at more than one layer. Keep this copy in sync with the API
 * helper.
 */

const REDACTED = "[redacted]";

/**
 * `password=...`, `api_key: ...`, `client_secret = "..."` and friends. The
 * key is kept so the redaction is visible in the notification; only the value
 * is replaced.
 */
const CREDENTIAL_ASSIGNMENT =
  /(\b(?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|client[_-]?secret|private[_-]?key|auth[_-]?token)\b\s*[:=]\s*)("[^"\n]*"|'[^'\n]*'|\S+)/gi;

/** `Authorization: Bearer <token>` style credentials. */
const BEARER_TOKEN = /\b(bearer\s+)[A-Za-z0-9._~+/=-]{8,}/gi;

/** PEM private-key blocks (multi-line). */
const PRIVATE_KEY_BLOCK =
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g;

/**
 * Provider-specific token shapes that do not carry a `key=value` prefix.
 * Keep this list short and precise to avoid redacting ordinary text.
 */
const TOKEN_SHAPES: RegExp[] = [
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, // GitHub PAT/OAuth/app/refresh/server tokens
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, // AWS access key id
  /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{10,}\b/g, // Stripe secret/restricted keys
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, // Slack tokens
  /\bAIza[0-9A-Za-z_-]{35}\b/g, // Google API keys
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, // JWTs
];

const SSN = /\b\d{3}-\d{2}-\d{4}\b/g;

/** Card-like digit runs; only redacted when they pass the Luhn checksum. */
const CARD_CANDIDATE = /\b(?:\d[ -]?){12,18}\d\b/g;

function passesLuhn(candidate: string): boolean {
  const digits = candidate.replace(/[^0-9]/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

/**
 * Replace credential-like values in notification/email text with
 * `[redacted]`. Safe to call more than once on the same string.
 */
export function redactSensitiveContent(value: string): string {
  if (!value) return value;

  let redacted = value.replace(PRIVATE_KEY_BLOCK, REDACTED);
  redacted = redacted.replace(CREDENTIAL_ASSIGNMENT, `$1${REDACTED}`);
  redacted = redacted.replace(BEARER_TOKEN, `$1${REDACTED}`);
  for (const shape of TOKEN_SHAPES) {
    redacted = redacted.replace(shape, REDACTED);
  }
  redacted = redacted.replace(SSN, REDACTED);
  redacted = redacted.replace(CARD_CANDIDATE, (candidate) =>
    passesLuhn(candidate) ? REDACTED : candidate,
  );
  return redacted;
}
