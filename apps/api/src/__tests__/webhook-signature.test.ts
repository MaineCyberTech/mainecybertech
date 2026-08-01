import { validateWebhookTimestamp } from "../lib/webhook-signature";

describe("validateWebhookTimestamp", () => {
  const nowMs = Date.now();

  it("accepts a millisecond timestamp within tolerance", () => {
    expect(validateWebhookTimestamp({ timestamp: nowMs })).toBe(true);
  });

  it("normalizes epoch-seconds timestamps to milliseconds", () => {
    expect(validateWebhookTimestamp({ timestamp: Math.floor(nowMs / 1000) })).toBe(true);
  });

  it("rejects timestamps outside tolerance", () => {
    expect(validateWebhookTimestamp({ timestamp: nowMs - 10 * 60 * 1000 })).toBe(false);
    expect(validateWebhookTimestamp({ timestamp: nowMs + 10 * 60 * 1000 })).toBe(false);
  });

  it("rejects ISO string timestamps outside tolerance", () => {
    expect(
      validateWebhookTimestamp({ timestamp: new Date(nowMs - 10 * 60 * 1000).toISOString() }),
    ).toBe(false);
  });

  it("accepts ISO string timestamps within tolerance", () => {
    expect(validateWebhookTimestamp({ timestamp: new Date(nowMs).toISOString() })).toBe(true);
  });

  it("skips payloads without a timestamp by default", () => {
    expect(validateWebhookTimestamp({ webhookEvent: "issue_created" })).toBe(true);
  });

  it("rejects payloads without a timestamp when requireTimestamp is set", () => {
    expect(validateWebhookTimestamp({ webhookEvent: "issue_created" }, undefined, { requireTimestamp: true })).toBe(false);
  });

  it("accepts a present timestamp when requireTimestamp is set", () => {
    expect(
      validateWebhookTimestamp({ timestamp: nowMs }, undefined, { requireTimestamp: true }),
    ).toBe(true);
  });
});
