import { jest } from "@jest/globals";
import {
  createDecipheriv,
  createECDH,
  createHmac,
  createPublicKey,
  createVerify,
} from "node:crypto";

jest.mock("pino", () => {
  const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  return jest.fn(() => mockLogger);
});

jest.mock("dotenv/config", () => ({}));

const envMock: Record<string, string | undefined> = {};
jest.mock("../env", () => ({ env: envMock, resolveRedisUrl: (url: string) => url }));

jest.mock("../logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock("../lib/pinned-fetch", () => ({
  pinnedFetch: jest.fn(),
}));

import { pinnedFetch } from "../lib/pinned-fetch";
import {
  buildPushPayload,
  buildVapidAuthorization,
  encryptPushPayload,
  isPushConfigured,
  sendPush,
  vapidKeyPairMatches,
} from "../push";

/** Generate a browser (user agent) key pair plus its auth secret. */
function generateUaKeys() {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  return {
    privateKey: ecdh.getPrivateKey(),
    publicKey: ecdh.getPublicKey(),
    authSecret: Buffer.from("0123456789abcdef", "utf8"),
  };
}

function hmac(key: Buffer, data: Buffer): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function hkdfExpand(prk: Buffer, info: Buffer, length: number): Buffer {
  return hmac(prk, Buffer.concat([info, Buffer.from([1])])).subarray(0, length);
}

/**
 * Reverse of encryptPushPayload (RFC 8291 decryption) so the round-trip test
 * validates the framing, HKDF labels and key derivation end to end.
 */
function decryptPushPayload(body: Buffer, uaPrivateKey: Buffer, authSecret: Buffer): Buffer {
  const salt = body.subarray(0, 16);
  const idlen = body.readUInt8(20);
  const asPublic = body.subarray(21, 21 + idlen);
  const ciphertext = body.subarray(21 + idlen);

  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(uaPrivateKey);
  const uaPublic = ecdh.getPublicKey();
  const sharedSecret = ecdh.computeSecret(asPublic);

  const prkKey = hmac(authSecret, sharedSecret);
  const ikm = hkdfExpand(
    prkKey,
    Buffer.concat([Buffer.from("WebPush: info\0", "utf8"), uaPublic, asPublic]),
    32,
  );
  const prk = hmac(salt, ikm);
  const cek = hkdfExpand(prk, Buffer.from("Content-Encoding: aes128gcm\0", "utf8"), 16);
  const nonce = hkdfExpand(prk, Buffer.from("Content-Encoding: nonce\0", "utf8"), 12);

  const tag = ciphertext.subarray(ciphertext.length - 16);
  const decipher = createDecipheriv("aes-128-gcm", cek, nonce);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext.subarray(0, ciphertext.length - 16)),
    decipher.final(),
  ]);

  // Last-record delimiter (0x02) precedes the (empty) padding.
  expect(plaintext[plaintext.length - 1]).toBe(0x02);
  return plaintext.subarray(0, plaintext.length - 1);
}

const vapidPair = (() => {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  return {
    publicKey: ecdh.getPublicKey().toString("base64url"),
    privateKey: ecdh.getPrivateKey().toString("base64url"),
  };
})();

beforeEach(() => {
  jest.clearAllMocks();
  envMock.VAPID_PUBLIC_KEY = vapidPair.publicKey;
  envMock.VAPID_PRIVATE_KEY = vapidPair.privateKey;
  envMock.VAPID_SUBJECT = "mailto:ops@example.com";
});

describe("isPushConfigured / vapidKeyPairMatches", () => {
  it("requires all three VAPID values", () => {
    expect(isPushConfigured()).toBe(true);
    envMock.VAPID_PRIVATE_KEY = undefined;
    expect(isPushConfigured()).toBe(false);
    envMock.VAPID_PRIVATE_KEY = vapidPair.privateKey;
    envMock.VAPID_SUBJECT = undefined;
    expect(isPushConfigured()).toBe(false);
  });

  it("detects a mismatched public/private pair", () => {
    const other = createECDH("prime256v1");
    other.generateKeys();
    expect(vapidKeyPairMatches(vapidPair.publicKey, vapidPair.privateKey)).toBe(true);
    expect(vapidKeyPairMatches(other.getPublicKey().toString("base64url"), vapidPair.privateKey)).toBe(
      false,
    );
  });
});

describe("encryptPushPayload (RFC 8291)", () => {
  it("round-trips a payload through the subscription keys", () => {
    const ua = generateUaKeys();
    const subscription = {
      p256dh: ua.publicKey.toString("base64url"),
      auth: ua.authSecret.toString("base64url"),
    };
    const payload = Buffer.from(JSON.stringify({ title: "Hi", body: "There" }), "utf8");

    const body = encryptPushPayload(payload, subscription);

    // header (16 salt + 4 rs + 1 idlen + 65 keyid) + plaintext + 1 + 16 tag
    expect(body.length).toBe(21 + 65 + payload.length + 1 + 16);
    expect(body.readUInt32BE(16)).toBe(4096);
    expect(body.readUInt8(20)).toBe(65);

    const decrypted = decryptPushPayload(body, ua.privateKey, ua.authSecret);
    expect(decrypted.equals(payload)).toBe(true);
  });

  it("rejects a malformed subscription key", () => {
    expect(() =>
      encryptPushPayload(Buffer.from("x"), { p256dh: "AAAA", auth: "AAAA" }),
    ).toThrow(/p256dh/);
  });

  it("rejects a payload that cannot fit one record", () => {
    const ua = generateUaKeys();
    expect(() =>
      encryptPushPayload(Buffer.alloc(5000, 0x61), {
        p256dh: ua.publicKey.toString("base64url"),
        auth: ua.authSecret.toString("base64url"),
      }),
    ).toThrow(/too large/);
  });
});

describe("buildVapidAuthorization (RFC 8292)", () => {
  it("signs an ES256 JWT with the endpoint origin as audience", () => {
    const now = 1_800_000_000_000;
    const header = buildVapidAuthorization(
      "https://push.example.com/wpush/v2/abc",
      {
        publicKey: vapidPair.publicKey,
        privateKey: vapidPair.privateKey,
        subject: "mailto:ops@example.com",
      },
      now,
    );

    const match = header.match(/^vapid t=([^,]+), k=(.+)$/);
    expect(match).not.toBeNull();
    const [, token, key] = match!;
    expect(key).toBe(vapidPair.publicKey);

    const [encodedHeader, encodedClaims, encodedSignature] = token.split(".");
    expect(JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8"))).toEqual({
      typ: "JWT",
      alg: "ES256",
    });
    const claims = JSON.parse(Buffer.from(encodedClaims, "base64url").toString("utf8"));
    expect(claims.aud).toBe("https://push.example.com");
    expect(claims.sub).toBe("mailto:ops@example.com");
    expect(claims.exp).toBe(Math.floor(now / 1000) + 12 * 60 * 60);

    const publicBytes = Buffer.from(vapidPair.publicKey, "base64url");
    const publicKeyObject = createPublicKey({
      key: {
        kty: "EC",
        crv: "P-256",
        x: publicBytes.subarray(1, 33).toString("base64url"),
        y: publicBytes.subarray(33, 65).toString("base64url"),
      },
      format: "jwk",
    });
    const valid = createVerify("sha256")
      .update(`${encodedHeader}.${encodedClaims}`)
      .verify(
        { key: publicKeyObject, dsaEncoding: "ieee-p1363" },
        Buffer.from(encodedSignature, "base64url"),
      );
    expect(valid).toBe(true);
  });
});

describe("buildPushPayload", () => {
  it("keeps title, body, url and tag", () => {
    expect(
      buildPushPayload({
        title: "Ticket assigned",
        body: "You were assigned ticket #1",
        url: "https://app.example.com/portal/tickets/1",
        tag: "ticket-1",
      }),
    ).toEqual({
      title: "Ticket assigned",
      body: "You were assigned ticket #1",
      url: "https://app.example.com/portal/tickets/1",
      tag: "ticket-1",
    });
  });

  it("truncates an oversized body so the payload fits one record", () => {
    const payload = buildPushPayload({ title: "T", body: "a".repeat(20_000) });
    expect(Buffer.byteLength(JSON.stringify(payload), "utf8")).toBeLessThanOrEqual(3900);
    expect(payload.body.length).toBeGreaterThan(0);
  });
});

describe("sendPush", () => {
  const ua = generateUaKeys();
  const subscription = {
    endpoint: "https://push.example.com/wpush/v2/abc",
    p256dh: ua.publicKey.toString("base64url"),
    auth: ua.authSecret.toString("base64url"),
  };

  it("posts an encrypted, VAPID-authorized request and returns success", async () => {
    (pinnedFetch as jest.Mock).mockResolvedValue({ status: 201, text: async () => "" });

    const result = await sendPush(subscription, { title: "Hi", body: "There" });

    expect(result).toEqual({ status: "success", statusCode: 201 });
    const [url, init] = (pinnedFetch as jest.Mock).mock.calls[0] as [
      string,
      { method: string; headers: Record<string, string>; body: Buffer },
    ];
    expect(url).toBe(subscription.endpoint);
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Encoding"]).toBe("aes128gcm");
    expect(init.headers.Authorization).toMatch(/^vapid t=/);
    expect(init.headers.TTL).toBe("86400");
    expect(init.body.subarray(0, 16)).toHaveLength(16);
  });

  it("treats 404/410 as a revoked subscription", async () => {
    (pinnedFetch as jest.Mock).mockResolvedValue({ status: 410, text: async () => "" });
    await expect(sendPush(subscription, { title: "Hi", body: "There" })).resolves.toEqual({
      status: "revoked",
      statusCode: 410,
    });
  });

  it("treats other non-2xx answers as failures", async () => {
    (pinnedFetch as jest.Mock).mockResolvedValue({ status: 503, text: async () => "busy" });
    const result = await sendPush(subscription, { title: "Hi", body: "There" });
    expect(result.status).toBe("failed");
    expect(result.statusCode).toBe(503);
  });

  it("returns a failure result instead of throwing when the transport fails", async () => {
    (pinnedFetch as jest.Mock).mockRejectedValue(new Error("ECONNREFUSED"));
    const result = await sendPush(subscription, { title: "Hi", body: "There" });
    expect(result).toEqual({ status: "failed", error: "ECONNREFUSED" });
  });

  it("fails closed when VAPID is unconfigured", async () => {
    envMock.VAPID_PUBLIC_KEY = undefined;
    const result = await sendPush(subscription, { title: "Hi", body: "There" });
    expect(result.status).toBe("failed");
    expect(pinnedFetch).not.toHaveBeenCalled();
  });

  it("refuses a non-https endpoint", async () => {
    const result = await sendPush(
      { ...subscription, endpoint: "http://push.example.com/wpush/v2/abc" },
      { title: "Hi", body: "There" },
    );
    expect(result.status).toBe("failed");
    expect(pinnedFetch).not.toHaveBeenCalled();
  });
});
