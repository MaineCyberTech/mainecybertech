import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed one-click unsubscribe tokens (NOTIF-P3-005) — worker mirror of
 * `apps/api/src/lib/unsubscribe-token.ts`. The worker is a separate deployable
 * and cannot import API source, so the small helper is duplicated here with
 * the SAME derivation and token format; keep the two in sync.
 *
 * The HMAC key is derived (domain-separated) from the service-role key both
 * deployables already hold, so no new secret must be provisioned.
 */

const KEY_DERIVATION_LABEL = "mct-unsubscribe-token:v1";

export interface UnsubscribeTokenPayload {
  userId: string;
  organizationId: string;
}

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
