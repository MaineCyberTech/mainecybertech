import { scrubSentryEvent, isSentryPiiKey } from "../lib/sentry-scrub";

/**
 * AN-P3-004: error telemetry must not carry personal data. These tests pin the
 * key-level scrub for the shapes Sentry assembles (request, user, extra,
 * contexts, breadcrumbs) and the deep redaction of nested values.
 */
describe("Sentry PII scrubbing (AN-P3-004)", () => {
  it("classifies PII keys by exact name and substring", () => {
    expect(isSentryPiiKey("email")).toBe(true);
    expect(isSentryPiiKey("fullName")).toBe(true);
    expect(isSentryPiiKey("job_title")).toBe(true);
    expect(isSentryPiiKey("ip_address")).toBe(true);
    expect(isSentryPiiKey("authorization")).toBe(true);
    expect(isSentryPiiKey("file_name")).toBe(false);
    expect(isSentryPiiKey("company_name")).toBe(false);
    expect(isSentryPiiKey("status")).toBe(false);
  });

  it("redacts request headers, drops cookies and scrubs request data", () => {
    const event = {
      request: {
        headers: { authorization: "Bearer secret", cookie: "sid=1", accept: "application/json" },
        cookies: { session: "abc" },
        data: { email: "a@b.co", nested: { phone: "207-555-0000", keep: "ok" } },
      },
    };

    scrubSentryEvent(event);

    expect(event.request.headers.authorization).toBe("[REDACTED]");
    expect(event.request.headers.cookie).toBe("[REDACTED]");
    expect(event.request.headers.accept).toBe("application/json");
    expect(event.request.cookies).toBeUndefined();
    expect(event.request.data.email).toBe("[REDACTED]");
    expect(event.request.data.nested.phone).toBe("[REDACTED]");
    expect(event.request.data.nested.keep).toBe("ok");
  });

  it("removes direct identifiers from the user object but keeps the opaque id", () => {
    const event = {
      user: { id: "user-1", email: "a@b.co", username: "alice", ip_address: "203.0.113.7" },
    };

    scrubSentryEvent(event);

    expect(event.user).toEqual({ id: "user-1" });
  });

  it("scrubs extra, contexts and breadcrumb data recursively", () => {
    const breadcrumbs: Array<{ data?: Record<string, unknown> }> = [
      { data: { email: "a@b.co", path: "/portal" } },
      {},
    ];
    const event = {
      extra: { profile: { full_name: "Alice Example", plan: "pro" } },
      contexts: { runtime: { version: "20", password: "hunter2" } },
      breadcrumbs,
    };

    scrubSentryEvent(event);

    expect(event.extra.profile.full_name).toBe("[REDACTED]");
    expect(event.extra.profile.plan).toBe("pro");
    expect(event.contexts.runtime.password).toBe("[REDACTED]");
    expect(breadcrumbs[0].data?.email).toBe("[REDACTED]");
    expect(breadcrumbs[0].data?.path).toBe("/portal");
  });

  it("caps recursion depth instead of walking unbounded structures", () => {
    let deep: Record<string, unknown> = { email: "a@b.co" };
    for (let i = 0; i < 10; i++) deep = { nested: deep };

    const event = { extra: deep };
    scrubSentryEvent(event);

    expect(JSON.stringify(event.extra)).not.toContain("a@b.co");
  });
});
