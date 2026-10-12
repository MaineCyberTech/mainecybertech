import { scrubSentryEvent } from "../lib/sentry-scrub";

/**
 * AN-P3-004: worker error telemetry. Task payloads are already reduced to key
 * names at capture sites; this pins the last-line scrub for anything that
 * still reaches the SDK.
 */
describe("worker Sentry PII scrubbing (AN-P3-004)", () => {
  it("scrubs task extras and drops request cookies", () => {
    const event = {
      request: { cookies: { session: "abc" } },
      extra: { recipient: { email: "a@b.co" }, taskType: "notification-email" },
      contexts: { trace: { id: "abc" } },
    };

    scrubSentryEvent(event);

    expect(event.request.cookies).toBeUndefined();
    expect(event.extra.recipient.email).toBe("[REDACTED]");
    expect(event.extra.taskType).toBe("notification-email");
    expect(event.contexts.trace.id).toBe("abc");
  });
});
