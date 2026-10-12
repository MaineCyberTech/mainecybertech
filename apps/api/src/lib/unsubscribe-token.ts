import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed one-click unsubscribe tokens (NOTIF-P3-005).
 *
 * Emails carry a link to `GET /api/v1/notifications/unsubscribe?token=...`
 * that flips the recipient's global email opt-out for the organization the
 * notification belongs to. The token is an HMAC over `{userId, organizationId}`
 * so the endpoint needs no session — possession of the emailed link is the
 * capability.
 *
 * Key management: the HMAC key is derived (domain-separated) from the
 * service-role key that both deployables already hold, so no new secret has to
 * be provisioned or distributed to the worker.
 *
 * NOTE: the worker mirror lives in `apps/worker/src/lib/unsubscribe-token.ts`
 * (the worker cannot import API source); keep the token format in sync.
 */

const KEY_DERIVATION_LABEL = "mct-unsubscribe-token:v1";

export interface UnsubscribeTokenPayload {
  userId: string;
  organizationId: string;
}

/** Domain-separated key so the raw service-role key is never used as the MAC key. */
export function deriveUnsubscribeSecret(serviceRoleKey: string): string {
  return createHmac("sha256", serviceRoleKey).update(KEY_DERIVATION_LABEL).digest("base64url");
}

export function buildUnsubscribeToken(
  payload: UnsubscribeTokenPayload,
  serviceRoleKey: string,
): string {
  const body = Buffer.from(
    JSON.stringify({ u: payload.userId, o: payload.organizationId }),
  ).toString("base64url");
  const mac = createHmac("sha256", deriveUnsubscribeSecret(serviceRoleKey))
    .update(body)
    .digest("base64url");
  return `${body}.${mac}`;
}

export function verifyUnsubscribeToken(
  token: string,
  serviceRoleKey: string,
): UnsubscribeTokenPayload | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;

  const expected = createHmac("sha256", deriveUnsubscribeSecret(serviceRoleKey)).update(body).digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(mac, "base64url");
  } catch {
    return null;
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      u?: unknown;
      o?: unknown;
    };
    if (typeof parsed.u !== "string" || typeof parsed.o !== "string") return null;
    if (!parsed.u || !parsed.o) return null;
    return { userId: parsed.u, organizationId: parsed.o };
  } catch {
    return null;
  }
}

/** Build the clickable unsubscribe URL embedded in notification emails. */
export function buildUnsubscribeUrl(opts: {
  apiBaseUrl: string;
  userId: string;
  organizationId: string;
  serviceRoleKey: string;
}): string {
  const token = buildUnsubscribeToken(
    { userId: opts.userId, organizationId: opts.organizationId },
    opts.serviceRoleKey,
  );
  const base = opts.apiBaseUrl.replace(/\/$/, "");
  return `${base}/api/v1/notifications/unsubscribe?token=${encodeURIComponent(token)}`;
}
