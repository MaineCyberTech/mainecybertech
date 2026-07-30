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

function extractTimestamp(payload: Record<string, unknown>): number | null {
  // Check common timestamp fields in webhook payloads
  const ts =
    (payload as any).timestamp ??
    (payload as any).timestampMillis ??
    (payload as any).created_at ??
    (payload as any).occurred_at ??
    (payload as any).event_date;
  if (!ts) return null;

  const parsed = typeof ts === "number" ? ts : Date.parse(String(ts));
  return isNaN(parsed) ? null : parsed;
}

export function validateWebhookTimestamp(
  payload: Record<string, unknown>,
  toleranceMs: number = TIMESTAMP_TOLERANCE_MS,
): boolean {
  const ts = extractTimestamp(payload);
  if (ts === null) return true; // no timestamp to validate — skip
  return Math.abs(Date.now() - ts) <= toleranceMs;
}
