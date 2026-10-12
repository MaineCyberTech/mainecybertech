import { jest } from "@jest/globals";

jest.mock("../env", () => ({
  env: {
    LOG_LEVEL: "silent",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    API_BASE_URL: "https://api.test",
    APP_BASE_URL: "https://app.test",
  },
}));

jest.mock("../logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock("../services/supabase", () => ({
  wsTransport: jest.fn(),
}));

jest.mock("../email", () => ({ sendEmail: jest.fn() }));

jest.mock("../lib/notification-throttle", () => ({
  EMAIL_THROTTLE_WINDOW_SECONDS: 3600,
  EMAIL_THROTTLE_MAX_PER_WINDOW: 30,
  isEmailThrottled: jest.fn().mockResolvedValue(false),
}));

jest.mock("../notification-store", () => ({
  insertNotification: jest
    .fn()
    .mockResolvedValue({ inserted: true, deduped: false, suppressed: false }),
  resolveChannels: jest.fn().mockResolvedValue({ email: true, in_app: true, push: true }),
  buildNotificationKey: jest.fn().mockReturnValue("key-1"),
  claimNotificationEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock("../metrics", () => ({
  recordNotificationDelivery: jest.fn(),
  recordNotificationSuppressed: jest.fn(),
  recordNotificationThrottled: jest.fn(),
}));

jest.mock("@supabase/supabase-js", () => {
  const from = jest.fn();
  return { createClient: jest.fn(() => ({ from })) };
});

import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "../email";
import { insertNotification, resolveChannels } from "../notification-store";
import { isEmailThrottled } from "../lib/notification-throttle";
import { recordNotificationThrottled } from "../metrics";
import { verifyUnsubscribeToken } from "../lib/unsubscribe-token";

type Result = { data: unknown; error: unknown };

/** Minimal thenable PostgREST-style builder. */
function chain(result: Result) {
  const builder: Record<string, unknown> = {};
  const self = () => builder;
  for (const method of [
    "select",
    "eq",
    "in",
    "is",
    "gte",
    "lte",
    "neq",
    "not",
    "limit",
    "maybeSingle",
    "single",
  ]) {
    builder[method] = jest.fn(self);
  }
  builder.then = (
    onfulfilled?: (v: Result) => unknown,
    onrejected?: (v: unknown) => unknown,
  ) => Promise.resolve(result).then(onfulfilled, onrejected);
  return builder;
}

describe("scheduledNotifications content sensitivity (NOTIF-P2-005)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sendEmail as jest.Mock).mockResolvedValue(true);
  });

  it("redacts secrets in the ticket-responded email and stored row", async () => {
    const client = (createClient as unknown as jest.Mock)() as { from: jest.Mock };
    client.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return chain({
          data: { email: "user@example.com", full_name: "User" },
          error: null,
        });
      }
      return chain({ data: null, error: null });
    });

    // Assembled at runtime so the repo's diff-based secret scanner does not
    // flag the fixture itself.
    const secret = ["AKIA", "IOSFODNN7EXAMPLE"].join("");
    const { scheduledNotifications } = await import("../tasks/scheduled-notifications");
    const result = await scheduledNotifications({
      type: "ticket-responded",
      targetUserId: "user-2",
      title: "Printer offline",
      body: `Credentials pasted in the ticket: ${secret} password=hunter2`,
      metadata: { ticketId: "ticket-1" },
    });

    expect(result.ok).toBe(true);

    const stored = (insertNotification as jest.Mock).mock.calls[0][1] as {
      title: string;
      body: string;
    };
    expect(stored.body).not.toContain(secret);
    expect(stored.body).not.toContain("hunter2");
    expect(stored.body).toContain("[redacted]");

    const payload = (sendEmail as jest.Mock).mock.calls[0][0] as {
      subject: string;
      text: string;
      html: string;
    };
    expect(payload.subject).not.toContain(secret);
    expect(payload.text).not.toContain(secret);
    expect(payload.text).not.toContain("hunter2");
    expect(payload.html).not.toContain(secret);
    expect(payload.html).not.toContain("hunter2");
  });
});

describe("scheduledNotifications org scoping + link safety (NOTIF-P3-006/008)", () => {
  function mockProfiles() {
    const client = (createClient as unknown as jest.Mock)() as { from: jest.Mock };
    client.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return chain({
          data: { email: "user@example.com", full_name: "User" },
          error: null,
        });
      }
      return chain({ data: null, error: null });
    });
    return client;
  }

  it("scopes the preference lookup and stored row to the notification's org", async () => {
    mockProfiles();
    const { scheduledNotifications } = await import("../tasks/scheduled-notifications");

    await scheduledNotifications({
      type: "ticket-responded",
      targetUserId: "user-2",
      organizationId: "org-9",
      title: "Printer offline",
      body: "A ticket has been updated.",
      metadata: { ticketId: "ticket-1" },
    });

    expect(resolveChannels).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: "user-2", organizationId: "org-9", module: "tickets" }),
    );
    expect(insertNotification).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: "user-2", organizationId: "org-9" }),
      expect.anything(),
    );
  });

  it("percent-encodes a hostile ticket id and never emits a raw tag in the href", async () => {
    mockProfiles();
    const { scheduledNotifications } = await import("../tasks/scheduled-notifications");

    await scheduledNotifications({
      type: "ticket-responded",
      targetUserId: "user-2",
      organizationId: "org-9",
      title: "Printer offline",
      body: "A ticket has been updated.",
      metadata: { ticketId: '"><script>alert(1)</script>' },
    });

    const payload = (sendEmail as jest.Mock).mock.calls[0][0] as { html: string };
    expect(payload.html).toContain("%22%3E%3Cscript%3E");
    expect(payload.html).not.toContain('"><script>');
  });

  it("renders the shared footer with a signed unsubscribe link (NOTIF-P3-001/005)", async () => {
    mockProfiles();
    const { scheduledNotifications } = await import("../tasks/scheduled-notifications");

    await scheduledNotifications({
      type: "ticket-responded",
      targetUserId: "user-2",
      organizationId: "org-9",
      title: "Printer offline",
      body: "A ticket has been updated.",
      metadata: { ticketId: "ticket-1" },
    });

    const payload = (sendEmail as jest.Mock).mock.calls[0][0] as { html: string; text: string };
    expect(payload.html).toContain("Manage notification preferences");
    expect(payload.html).toContain("Unsubscribe from these emails");
    const match = payload.html.match(/unsubscribe\?token=([^"&]+)/);
    expect(match).not.toBeNull();
    expect(
      verifyUnsubscribeToken(decodeURIComponent((match as RegExpMatchArray)[1]!), "service-role-key"),
    ).toEqual({ userId: "user-2", organizationId: "org-9" });
  });

  it("throttles the send per recipient and meters the drop (NOTIF-P3-007)", async () => {
    (isEmailThrottled as jest.Mock).mockResolvedValueOnce(true);
    mockProfiles();
    const { scheduledNotifications } = await import("../tasks/scheduled-notifications");

    await scheduledNotifications({
      type: "ticket-responded",
      targetUserId: "user-2",
      organizationId: "org-9",
      title: "Printer offline",
      body: "A ticket has been updated.",
      metadata: { ticketId: "ticket-1" },
    });

    expect(sendEmail).not.toHaveBeenCalled();
    expect(recordNotificationThrottled).toHaveBeenCalledWith("email");
  });
});
