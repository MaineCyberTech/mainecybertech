import {
  createCipheriv,
  createECDH,
  createHmac,
  createPrivateKey,
  createSign,
  randomBytes,
} from "node:crypto";
import { env } from "./env";
import { logger } from "./logger";
import { pinnedFetch } from "./lib/pinned-fetch";

/**
 * Web Push sending (NOTIF-P2-001).
 *
 * Dependency-free implementation of RFC 8291 (aes128gcm payload encryption)
 * and RFC 8292 (VAPID authorization) on top of the existing SSRF-hardened
 * `pinnedFetch`, so the channel adds no new runtime dependency and user-supplied
 * endpoints still resolve through the DNS-pinned guard.
 *
 * Operator-gated: `isPushConfigured()` is false unless VAPID_PUBLIC_KEY,
 * VAPID_PRIVATE_KEY and VAPID_SUBJECT are all set; callers treat that as a
 * no-op (record `skipped`), never as a delivery failure.
 */

export type PushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export type PushSendStatus = "success" | "failed" | "revoked";
export type PushSendResult = {
  status: PushSendStatus;
  statusCode?: number;
  error?: string;
};

/** RFC 8188 record size; single-record messages, so plaintext must fit. */
const RECORD_SIZE = 4096;
/**
 * Payload budget: a 4096-octet record must hold the 21+65-byte header, the
 * AEAD tag (16) and the padding delimiter (1). 3993 is the safe maximum; we
 * keep a little headroom for push services that count the whole request body.
 */
const MAX_PAYLOAD_BYTES = 3900;
const VAPID_TOKEN_TTL_SECONDS = 12 * 60 * 60;
const PUSH_TTL_SECONDS = 24 * 60 * 60;
const SEND_TIMEOUT_MS = 10_000;

export function isPushConfigured(): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);
}

function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function hmacSha256(key: Buffer, data: Buffer): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

/** HKDF-Expand for outputs of at most one SHA-256 block (32 bytes). */
function hkdfExpand(prk: Buffer, info: Buffer, length: number): Buffer {
  return hmacSha256(prk, Buffer.concat([info, Buffer.from([1])])).subarray(0, length);
}

/**
 * True when the configured VAPID public key is the public half of the
 * configured private key. A mismatch (common when keys are rotated by hand)
 * would make every push service reject the request, so callers fail closed
 * with a clear error instead.
 */
export function vapidKeyPairMatches(publicKey: string, privateKey: string): boolean {
  try {
    const publicBytes = decodeBase64Url(publicKey);
    const privateBytes = decodeBase64Url(privateKey);
    if (publicBytes.length !== 65 || publicBytes[0] !== 0x04) return false;
    if (privateBytes.length !== 32) return false;
    const ecdh = createECDH("prime256v1");
    ecdh.setPrivateKey(privateBytes);
    return ecdh.getPublicKey().equals(publicBytes);
  } catch {
    return false;
  }
}

/**
 * Encrypt a payload for one subscription (RFC 8291, aes128gcm).
 *
 * Derivation:
 *   ecdh_secret = ECDH(as_private, ua_public)
 *   PRK_key     = HKDF-Extract(auth_secret, ecdh_secret)
 *   IKM         = HKDF-Expand(PRK_key, "WebPush: info" || 0x00 || ua_public || as_public, 32)
 *   PRK         = HKDF-Extract(salt, IKM)
 *   CEK         = HKDF-Expand(PRK, "Content-Encoding: aes128gcm" || 0x00, 16)
 *   NONCE       = HKDF-Expand(PRK, "Content-Encoding: nonce" || 0x00, 12)
 *
 * Body: header (salt || rs || idlen || keyid) || AEAD(plaintext || 0x02).
 */
export function encryptPushPayload(
  payload: Buffer,
  subscription: Pick<PushSubscription, "p256dh" | "auth">,
): Buffer {
  const uaPublic = decodeBase64Url(subscription.p256dh);
  const authSecret = decodeBase64Url(subscription.auth);

  if (uaPublic.length !== 65 || uaPublic[0] !== 0x04) {
    throw new Error("Invalid subscription p256dh key (expected a 65-byte uncompressed P-256 point)");
  }
  if (authSecret.length < 16) {
    throw new Error("Invalid subscription auth secret (expected at least 16 bytes)");
  }
  if (payload.length > MAX_PAYLOAD_BYTES) {
    throw new Error(`Push payload is too large (${payload.length} bytes, max ${MAX_PAYLOAD_BYTES})`);
  }

  const ecdh = createECDH("prime256v1");
  const asPublic = ecdh.generateKeys();
  const sharedSecret = ecdh.computeSecret(uaPublic);

  const prkKey = hmacSha256(authSecret, sharedSecret);
  const ikm = hkdfExpand(
    prkKey,
    Buffer.concat([Buffer.from("WebPush: info\0", "utf8"), uaPublic, asPublic]),
    32,
  );

  const salt = randomBytes(16);
  const prk = hmacSha256(salt, ikm);
  const cek = hkdfExpand(prk, Buffer.from("Content-Encoding: aes128gcm\0", "utf8"), 16);
  const nonce = hkdfExpand(prk, Buffer.from("Content-Encoding: nonce\0", "utf8"), 12);

  const header = Buffer.alloc(21 + asPublic.length);
  salt.copy(header, 0);
  header.writeUInt32BE(RECORD_SIZE, 16);
  header.writeUInt8(asPublic.length, 20);
  asPublic.copy(header, 21);

  const plaintext = Buffer.concat([payload, Buffer.from([0x02])]);
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  return Buffer.concat([header, ciphertext]);
}

/**
 * Build the `Authorization: vapid t=<jwt>, k=<key>` header (RFC 8292). The
 * JWT is ES256-signed over `{aud: <endpoint origin>, exp, sub}` with the raw
 * (ieee-p1363) signature encoding VAPID requires.
 */
export function buildVapidAuthorization(
  endpoint: string,
  keys: { publicKey: string; privateKey: string; subject: string },
  now: number = Date.now(),
): string {
  const publicBytes = decodeBase64Url(keys.publicKey);
  const privateBytes = decodeBase64Url(keys.privateKey);
  if (publicBytes.length !== 65 || publicBytes[0] !== 0x04) {
    throw new Error("VAPID_PUBLIC_KEY is not a 65-byte uncompressed P-256 point");
  }
  if (privateBytes.length !== 32) {
    throw new Error("VAPID_PRIVATE_KEY is not a 32-byte P-256 scalar");
  }

  const header = Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" }), "utf8").toString(
    "base64url",
  );
  const claims = Buffer.from(
    JSON.stringify({
      aud: new URL(endpoint).origin,
      exp: Math.floor(now / 1000) + VAPID_TOKEN_TTL_SECONDS,
      sub: keys.subject,
    }),
    "utf8",
  ).toString("base64url");
  const signingInput = `${header}.${claims}`;

  const keyObject = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      x: publicBytes.subarray(1, 33).toString("base64url"),
      y: publicBytes.subarray(33, 65).toString("base64url"),
      d: privateBytes.toString("base64url"),
    },
    format: "jwk",
  });

  const signature = createSign("sha256")
    .update(signingInput)
    .sign({ key: keyObject, dsaEncoding: "ieee-p1363" });

  return `vapid t=${signingInput}.${signature.toString("base64url")}, k=${keys.publicKey}`;
}

/**
 * Cap and normalize the JSON payload a push service receives. The title/body
 * already passed the notification sensitivity filter upstream; the URL is the
 * portal deep link the service worker opens on click.
 */
export function buildPushPayload(input: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}): PushPayload {
  const payload: PushPayload = {
    title: input.title.slice(0, 200),
    body: input.body.slice(0, 4000),
    ...(input.url ? { url: input.url.slice(0, 2048) } : {}),
    ...(input.tag ? { tag: input.tag.slice(0, 128) } : {}),
  };

  while (Buffer.byteLength(JSON.stringify(payload), "utf8") > MAX_PAYLOAD_BYTES && payload.body) {
    payload.body = payload.body.slice(0, Math.max(0, payload.body.length - 64));
  }

  return payload;
}

/**
 * Send one push. Never throws: a transport error, a 4xx/5xx answer and a
 * gone subscription (404/410) are all returned as a result so the task can
 * record per-subscription outcomes and revoke dead subscriptions.
 */
export async function sendPush(
  subscription: PushSubscription,
  payload: PushPayload,
  options: { signal?: AbortSignal } = {},
): Promise<PushSendResult> {
  if (!isPushConfigured()) {
    return { status: "failed", error: "VAPID is not configured" };
  }

  // Defense in depth: the API only accepts https endpoints, but a push must
  // never be sent in plaintext even if a row slipped in another way.
  if (!subscription.endpoint.startsWith("https://")) {
    return { status: "failed", error: "Push endpoint is not an https URL" };
  }

  const publicKey = env.VAPID_PUBLIC_KEY!;
  const privateKey = env.VAPID_PRIVATE_KEY!;
  const subject = env.VAPID_SUBJECT!;

  if (!vapidKeyPairMatches(publicKey, privateKey)) {
    logger.error("VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY are not a key pair — refusing to send push");
    return { status: "failed", error: "VAPID key pair mismatch" };
  }

  try {
    const body = encryptPushPayload(
      Buffer.from(JSON.stringify(payload), "utf8"),
      subscription,
    );
    const authorization = buildVapidAuthorization(subscription.endpoint, {
      publicKey,
      privateKey,
      subject,
    });

    const response = await pinnedFetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        "Content-Length": String(body.length),
        TTL: String(PUSH_TTL_SECONDS),
      },
      body,
      signal: options.signal ?? AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    if (response.status >= 200 && response.status < 300) {
      return { status: "success", statusCode: response.status };
    }

    // RFC 8030: 404/410 mean the subscription is permanently gone.
    if (response.status === 404 || response.status === 410) {
      return { status: "revoked", statusCode: response.status };
    }

    const text = await response.text().catch(() => "");
    return {
      status: "failed",
      statusCode: response.status,
      error: `HTTP ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
