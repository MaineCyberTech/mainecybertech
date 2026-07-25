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
