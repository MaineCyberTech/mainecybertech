import fs from "fs";
import path from "path";
import { WEBHOOK_EVENTS } from "@mct/sdk/webhook-events";

/**
 * EVOL-P2-002: both webhook UI event pickers must consume the shared catalog
 * instead of keeping their own 11-event copies. Fails CI if a local
 * EVENT_OPTIONS list is reintroduced or the import is dropped.
 */

const UI_FILES = [
  path.join(__dirname, "..", "..", "components", "admin", "NewWebhookForm.tsx"),
  path.join(
    __dirname,
    "..",
    "..",
    "app",
    "(admin)",
    "admin",
    "webhooks",
    "[webhookId]",
    "WebhookDetailClient.tsx",
  ),
];

describe("webhook event catalog consumers (EVOL-P2-002)", () => {
  it("keeps every event picker bound to the shared catalog", () => {
    expect(WEBHOOK_EVENTS).toContain("ticket.created");
    for (const file of UI_FILES) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).toContain('from "@mct/sdk/webhook-events"');
      expect(source).toContain("WEBHOOK_EVENTS.map");
      expect(source).not.toContain("EVENT_OPTIONS");
    }
  });
});
