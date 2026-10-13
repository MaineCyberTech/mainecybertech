import {
  buildUnsubscribeToken,
  buildUnsubscribeUrl,
  verifyUnsubscribeToken,
} from "../lib/unsubscribe-token";

/**
 * NOTIF-P3-005: the one-click unsubscribe token is the only credential on the
 * public endpoint, so its signature/tamper behaviour is security-relevant.
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
      JSON.stringify({ u: "victim", o: "org-1" }),
    ).toString("base64url");
    expect(
      verifyUnsubscribeToken(`${forgedBody}.${token.split(".")[1]}`, serviceRoleKey),
    ).toBeNull();
    expect(verifyUnsubscribeToken(token, "another-secret-key-long-enough-x")).toBeNull();
    expect(verifyUnsubscribeToken(`${body}.`, serviceRoleKey)).toBeNull();
    expect(verifyUnsubscribeToken("not-a-token", serviceRoleKey)).toBeNull();
    expect(verifyUnsubscribeToken("", serviceRoleKey)).toBeNull();
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
});
