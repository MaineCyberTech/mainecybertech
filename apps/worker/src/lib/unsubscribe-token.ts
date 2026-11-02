import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed one-click unsubscribe tokens (NOTIF-P3-005) — worker mirror of
 * `apps/api/src/lib/unsubscribe-token.ts`. The worker is a separate deployable
 * and cannot import API source, so the small helper is duplicated here with
 * the SAME derivation and token format; keep the two in sync.
 *
 * NOTIF-P2-012: the token now carries an `exp` claim (90 days), matching the
 * API verifier. Keep the TTL and payload shape identical or links minted by
 * the worker will be rejected by the API.
 *
 * The HMAC key is derived (domain-separated) from the service-role key both
 * deployables already hold, so no new secret must be provisioned.
 */

const KEY_DERIVATION_LABEL = "mct-unsubscribe-token:v1";

/** Bounded validity for emailed unsubscribe links (NOTIF-P2-012). */
export const UNSUBSCRIBE_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60;

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
  opts: { ttlSeconds?: number } = {},
): string {
  const ttlSeconds = opts.ttlSeconds ?? UNSUBSCRIBE_TOKEN_TTL_SECONDS;
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = Buffer.from(
    JSON.stringify({ u: payload.userId, o: payload.organizationId, e: expiresAt }),
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
      e?: unknown;
    };
    if (typeof parsed.u !== "string" || typeof parsed.o !== "string") return null;
    if (!parsed.u || !parsed.o) return null;
    // NOTIF-P2-012: an expiry claim is mandatory and must be in the future.
    if (typeof parsed.e !== "number" || !Number.isFinite(parsed.e)) return null;
    if (parsed.e <= Math.floor(Date.now() / 1000)) return null;
    return { userId: parsed.u, organizationId: parsed.o };
  } catch {
    return null;
  }
}

/**
 * RFC 8058 one-click headers for notification emails (NOTIF-P2-012). Mirrors
 * the API helper; the worker builds its own emails.
 */
export function buildListUnsubscribeHeaders(unsubscribeUrl: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
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
