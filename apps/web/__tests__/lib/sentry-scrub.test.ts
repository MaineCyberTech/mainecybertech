import { scrubSentryEvent } from "@/lib/sentry-scrub";

/**
 * AN-P3-004: the web Sentry configs (client, server, edge) all route events
 * through this scrubber. The API-side test covers the recursive shapes; this
 * pins the client-relevant request/user fields.
 */
describe("web Sentry PII scrubbing (AN-P3-004)", () => {
  it("redacts request headers, drops cookies and removes user identifiers", () => {
    const event = {
      request: {
        headers: { cookie: "sid=1", "x-api-key": "secret", accept: "text/html" },
        cookies: { session: "abc" },
      },
      user: { id: "user-1", email: "a@b.co", ip_address: "203.0.113.7" },
      extra: { form: { phone: "207-555-0000", field: "ok" } },
    };

    scrubSentryEvent(event);

    expect(event.request.headers.cookie).toBe("[REDACTED]");
    expect(event.request.headers["x-api-key"]).toBe("[REDACTED]");
    expect(event.request.headers.accept).toBe("text/html");
    expect(event.request.cookies).toBeUndefined();
    expect(event.user).toEqual({ id: "user-1" });
    expect(event.extra.form.phone).toBe("[REDACTED]");
    expect(event.extra.form.field).toBe("ok");
  });
});
