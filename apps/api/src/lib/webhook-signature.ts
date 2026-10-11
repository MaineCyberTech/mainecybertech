import crypto from "crypto";

export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature) return false;

  try {
    const sig = signature.startsWith("sha256=") ? signature.slice(7) : signature;

    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    if (sig.length !== expected.length) return false;

    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * WH-P2-004: signature verification must run over the exact bytes received.
 * `express.json({ verify })` records them on `req.rawBody`, but a missing value
 * must FAIL CLOSED — re-serializing `req.body` can differ byte-for-byte from
 * what the provider signed, so the fallback produced an unpredictable verdict.
 * Returns null when no raw body is available.
 */
export function rawBodyBuffer(value: unknown): Buffer | null {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") return Buffer.from(value);
  return null;
}

function extractTimestamp(payload: Record<string, unknown>): number | null {
  // Check common timestamp fields in webhook payloads
  const ts =
    payload.timestamp ??
    payload.timestampMillis ??
    payload.created_at ??
    payload.occurred_at ??
    payload.event_date;
  if (ts === undefined || ts === null || ts === "") return null;

  let parsed: number;
  if (typeof ts === "number") {
    parsed = ts;
  } else {
    parsed = Date.parse(String(ts));
  }
  if (isNaN(parsed)) return null;

  // Normalize epoch-seconds to milliseconds (detect by magnitude: seconds ≈ 1e9-1e10, ms ≈ 1e12-1e13)
  if (parsed > 0 && parsed < 1e12) parsed *= 1000;

  return parsed;
}

export function validateWebhookTimestamp(
  payload: Record<string, unknown>,
  toleranceMs: number = TIMESTAMP_TOLERANCE_MS,
  options: { requireTimestamp?: boolean } = {},
): boolean {
  const ts = extractTimestamp(payload);
  if (ts === null) {
    // Reject payloads without a timestamp when the caller requires it (replay bound)
    return options.requireTimestamp ? false : true;
  }
  return Math.abs(Date.now() - ts) <= toleranceMs;
}
