import { createHmac } from "node:crypto";
import {
  buildListUnsubscribeHeaders,
  buildUnsubscribeToken,
  buildUnsubscribeUrl,
  deriveUnsubscribeSecret,
  verifyUnsubscribeToken,
} from "../lib/unsubscribe-token";

/**
 * NOTIF-P3-005 / NOTIF-P2-012: the one-click unsubscribe token is the only
 * credential on the public endpoint, so its signature/tamper/expiry behaviour
 * is security-relevant.
 */
describe("unsubscribe tokens (NOTIF-P3-005)", () => {
  const serviceRoleKey = "test-service-role-key-that-is-long-enough";

  it("round-trips a signed token", () => {
    const token = buildUnsubscribeToken(
      { userId: "user-1", organizationId: "org-1" },
      serviceRoleKey,
    );
    expect(verifyUnsubscribeToken(token, serviceRoleKey)).toEqual({
      userId: "user-1",
      organizationId: "org-1",
    });
  });

  it("rejects tampered payloads and foreign signatures", () => {
    const token = buildUnsubscribeToken(
      { userId: "user-1", organizationId: "org-1" },
      serviceRoleKey,
    );
    const [body] = token.split(".");
    const forgedBody = Buffer.from(
      JSON.stringify({ u: "victim", o: "org-1", e: Math.floor(Date.now() / 1000) + 3600 }),
    ).toString("base64url");
    expect(
      verifyUnsubscribeToken(`${forgedBody}.${token.split(".")[1]}`, serviceRoleKey),
    ).toBeNull();
    expect(verifyUnsubscribeToken(token, "another-secret-key-long-enough-x")).toBeNull();
    expect(verifyUnsubscribeToken(`${body}.`, serviceRoleKey)).toBeNull();
    expect(verifyUnsubscribeToken("not-a-token", serviceRoleKey)).toBeNull();
    expect(verifyUnsubscribeToken("", serviceRoleKey)).toBeNull();
  });

  // NOTIF-P2-012: the token is a mailbox-resident capability, so it expires.
  it("rejects an expired token", () => {
    const expired = buildUnsubscribeToken(
      { userId: "user-1", organizationId: "org-1" },
      serviceRoleKey,
      { ttlSeconds: 0 },
    );
    expect(verifyUnsubscribeToken(expired, serviceRoleKey)).toBeNull();
  });

  it("rejects a legacy token that carries no expiry claim", () => {
    // Pre-NOTIF-P2-012 tokens were an HMAC over {u,o} with no `e`. They must
    // not be honoured forever.
    const body = Buffer.from(JSON.stringify({ u: "user-1", o: "org-1" })).toString("base64url");
    const mac = createHmac("sha256", deriveUnsubscribeSecret(serviceRoleKey))
      .update(body)
      .digest("base64url");
    expect(verifyUnsubscribeToken(`${body}.${mac}`, serviceRoleKey)).toBeNull();
  });

  it("builds an encoded unsubscribe URL that verifies", () => {
    const url = buildUnsubscribeUrl({
      apiBaseUrl: "https://api.test/",
      userId: "user-1",
      organizationId: "org-1",
      serviceRoleKey,
    });
    expect(url.startsWith("https://api.test/api/v1/notifications/unsubscribe?token=")).toBe(true);
    const token = decodeURIComponent(url.split("token=")[1] ?? "");
    expect(verifyUnsubscribeToken(token, serviceRoleKey)).toEqual({
      userId: "user-1",
      organizationId: "org-1",
    });
  });

  it("builds RFC 8058 one-click headers around the unsubscribe URL", () => {
    const url = buildUnsubscribeUrl({
      apiBaseUrl: "https://api.test",
      userId: "user-1",
      organizationId: "org-1",
      serviceRoleKey,
    });
    expect(buildListUnsubscribeHeaders(url)).toEqual({
      "List-Unsubscribe": `<${url}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });
  });
});
