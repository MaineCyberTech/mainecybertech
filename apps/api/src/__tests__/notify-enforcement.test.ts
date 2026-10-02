import { jest } from "@jest/globals";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    APP_BASE_URL: "http://localhost:3000",
    LOG_LEVEL: "silent",
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

jest.mock("../lib/logger", () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock("../lib/email", () => ({ sendEmail: jest.fn() }));

jest.mock("../lib/task-producer", () => ({
  enqueueTask: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import { logger } from "../lib/logger";
import { sendEmail } from "../lib/email";
import { enqueueTask } from "../lib/task-producer";
import {
  createNotification,
  notifyAndEmail,
  buildNotificationKey,
} from "../lib/notify";
import {
  notificationDeliveryTotal,
  notificationSuppressedTotal,
} from "../lib/metrics";

type Result = { data: unknown; error: unknown };

/** Minimal thenable PostgREST-style builder. */
function chain(result: Result) {
  const builder: Record<string, unknown> = {};
  const self = () => builder;
  for (const method of ["select", "upsert", "insert", "eq", "is", "in", "limit"]) {
    builder[method] = jest.fn(self);
  }
  builder.then = (
    onfulfilled?: (v: Result) => unknown,
    onrejected?: (v: unknown) => unknown,
  ) => Promise.resolve(result).then(onfulfilled, onrejected);
  return builder;
}

/**
 * A fake Supabase that serves notification_preferences rows and emulates the
 * partial unique index on `notifications.notification_key` (ON CONFLICT DO
 * NOTHING): the second insert of the same key yields an empty result set.
 */
function fakeSupabase(options: {
  preferences?: { channel: string; enabled: boolean }[];
  preferencesError?: { message: string } | null;
}) {
  const seenKeys = new Set<string>();
  const inserts: Record<string, unknown>[] = [];

  const from = jest.fn((table: string) => {
    if (table === "notification_preferences") {
      return chain({
        data: options.preferences ?? [],
        error: options.preferencesError ?? null,
      });
    }
    // notifications
    return chain({ data: [], error: null });
  });

  return {
    from,
    seenKeys,
    inserts,
    /** Replace the notifications branch with dedup-aware behavior. */
    installDedup() {
      from.mockImplementation((table: string) => {
        if (table === "notification_preferences") {
          return chain({
            data: options.preferences ?? [],
            error: options.preferencesError ?? null,
          });
        }
        const builder = chain({ data: [], error: null });
        builder.upsert = jest.fn((row: Record<string, unknown>) => {
          inserts.push(row);
          const key = String(row.notification_key);
          if (seenKeys.has(key)) return chain({ data: [], error: null });
          seenKeys.add(key);
          return chain({ data: [{ id: `n-${seenKeys.size}` }], error: null });
        });
        return builder;
      });
    },
  };
}

const baseOpts = {
  userId: "user-1",
  organizationId: "org-1",
  title: "New Comment on Ticket",
  body: "A comment was added.",
  module: "tickets" as const,
  moduleId: "ticket-1",
  action: "comment",
};

beforeEach(() => {
  jest.clearAllMocks();
  (sendEmail as jest.Mock).mockResolvedValue(true);
  (enqueueTask as jest.Mock).mockResolvedValue(true);
});

describe("createNotification preference enforcement (NOTIF-P1-001)", () => {
  it("suppresses the in-app insert when the channel is disabled", async () => {
    const supabase = fakeSupabase({
      preferences: [{ channel: "in_app", enabled: false }],
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase as never);

    const result = await createNotification(baseOpts);

    expect(result.suppressed).toBe(true);
    expect(result.inserted).toBe(false);
    // No notification insert attempted at all.
    expect(supabase.from).not.toHaveBeenCalledWith("notifications");
    expect(notificationSuppressedTotal).toBeDefined();
  });

  it("inserts when the channel is explicitly enabled", async () => {
    const supabase = fakeSupabase({
      preferences: [{ channel: "in_app", enabled: true }],
    });
    supabase.installDedup();
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase as never);

    const result = await createNotification(baseOpts);
    expect(result.inserted).toBe(true);
    expect(supabase.inserts).toHaveLength(1);
  });

  it("defaults to enabled when no preference row exists", async () => {
    const supabase = fakeSupabase({ preferences: [] });
    supabase.installDedup();
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase as never);

    const result = await createNotification(baseOpts);
    expect(result.inserted).toBe(true);
  });

  it("is fail-safe: a preferences read error still sends and logs a warning", async () => {
    const supabase = fakeSupabase({
      preferencesError: { message: "boom" },
    });
    supabase.installDedup();
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase as never);

    const result = await createNotification(baseOpts);
    expect(result.inserted).toBe(true);
    expect(result.suppressed).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });
});

describe("notifyAndEmail preference enforcement (NOTIF-P1-001)", () => {
  it("does not enqueue or send email when the email channel is disabled", async () => {
    const supabase = fakeSupabase({
      preferences: [{ channel: "email", enabled: false }],
    });
    supabase.installDedup();
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase as never);

    const result = await notifyAndEmail({ ...baseOpts, email: "user@example.com" });

    expect(result.emailSkipped).toBe(true);
    expect(result.emailQueued).toBe(false);
    expect(result.emailSent).toBe(false);
    // In-app is still enabled (default) and was inserted.
    expect(result.inserted).toBe(true);
    expect(enqueueTask).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends email when enabled and in-app is disabled", async () => {
    const supabase = fakeSupabase({
      preferences: [
        { channel: "in_app", enabled: false },
        { channel: "email", enabled: true },
      ],
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase as never);

    const result = await notifyAndEmail({ ...baseOpts, email: "user@example.com" });

    expect(result.suppressed).toBe(true);
    expect(result.emailQueued).toBe(true);
    expect(enqueueTask).toHaveBeenCalledWith(
      "notification-email",
      expect.objectContaining({ to: "user@example.com" }),
    );
  });

  it("records an inline email failure instead of silently discarding the boolean", async () => {
    const supabase = fakeSupabase({ preferences: [] });
    supabase.installDedup();
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase as never);
    (enqueueTask as jest.Mock).mockResolvedValue(false);
    (sendEmail as jest.Mock).mockResolvedValue(false);

    const result = await notifyAndEmail({ ...baseOpts, email: "user@example.com" });

    expect(result.emailQueued).toBe(false);
    expect(result.emailSent).toBe(false);
    expect(sendEmail).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});

describe("createNotification dedup key (NOTIF-P1-002)", () => {
  it("sets notification_key on the insert and upserts on conflict", async () => {
    const supabase = fakeSupabase({ preferences: [] });
    supabase.installDedup();
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase as never);

    await createNotification(baseOpts);

    expect(supabase.inserts).toHaveLength(1);
    expect(supabase.inserts[0].notification_key).toBe(
      buildNotificationKey({
        userId: baseOpts.userId,
        module: baseOpts.module,
        moduleId: baseOpts.moduleId,
        action: baseOpts.action,
        title: baseOpts.title,
        body: baseOpts.body,
      }),
    );
  });

  it("deduplicates two identical notification attempts to a single row", async () => {
    const supabase = fakeSupabase({ preferences: [] });
    supabase.installDedup();
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase as never);

    const first = await createNotification(baseOpts);
    const second = await createNotification(baseOpts);

    expect(first.inserted).toBe(true);
    expect(second.inserted).toBe(false);
    expect(second.deduped).toBe(true);
    expect(supabase.inserts).toHaveLength(2); // same key attempted twice
    expect(supabase.seenKeys.size).toBe(1);
  });

  it("honours an explicit notificationKey over the derived key", async () => {
    const supabase = fakeSupabase({ preferences: [] });
    supabase.installDedup();
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase as never);

    await createNotification({ ...baseOpts, notificationKey: "comment-abc" });
    expect(supabase.inserts[0].notification_key).toBe("comment-abc");
  });

  it("produces distinct keys for distinct content", () => {
    const a = buildNotificationKey({ ...baseOpts });
    const b = buildNotificationKey({ ...baseOpts, body: "different body" });
    expect(a).not.toBe(b);
  });
});

describe("delivery metric", () => {
  it("increments the in-app delivery counter on a successful insert", async () => {
    const supabase = fakeSupabase({ preferences: [] });
    supabase.installDedup();
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase as never);

    const before = await (async () => {
      const m = await notificationDeliveryTotal.get();
      return m.values.find(
        (v) => v.labels.channel === "in_app" && v.labels.status === "success",
      )?.value ?? 0;
    })();

    await createNotification({ ...baseOpts, body: `metric-${Date.now()}` });

    const after = await (async () => {
      const m = await notificationDeliveryTotal.get();
      return m.values.find(
        (v) => v.labels.channel === "in_app" && v.labels.status === "success",
      )?.value ?? 0;
    })();
    expect(after).toBeGreaterThan(before);
  });
});
