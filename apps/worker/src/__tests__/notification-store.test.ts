import { jest } from "@jest/globals";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildNotificationKey,
  insertNotification,
  resolveChannels,
} from "../notification-store";

type Result = { data: unknown; error: unknown };

/** Build a thenable fake PostgREST client. */
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

function fakeSupabase(options: {
  preferences?: { channel: string; enabled: boolean }[];
  preferencesError?: { message: string } | null;
}) {
  const seenKeys = new Set<string>();
  const inserts: Record<string, unknown>[] = [];

  const build = () => {
    const from = jest.fn((table: string) => {
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
    return { from } as unknown as SupabaseClient;
  };

  const client = build();
  return { client, inserts, seenKeys };
}

const input = {
  userId: "user-1",
  organizationId: "org-1",
  title: "Task Due Soon",
  body: '"Fix firewall" is due within 24 hours.',
  module: "projects",
  moduleId: "task-1",
  action: "due_soon",
};

describe("worker resolveChannels (NOTIF-P1-001)", () => {
  it("returns in_app disabled when the preference is false", async () => {
    const { client } = fakeSupabase({
      preferences: [{ channel: "in_app", enabled: false }],
    });
    const channels = await resolveChannels(client, {
      userId: "user-1",
      organizationId: "org-1",
      module: "projects",
    });
    expect(channels).toEqual({ email: true, in_app: false });
  });

  it("defaults both channels to enabled when no row exists", async () => {
    const { client } = fakeSupabase({ preferences: [] });
    const channels = await resolveChannels(client, {
      userId: "user-1",
      module: "projects",
    });
    expect(channels).toEqual({ email: true, in_app: true });
  });

  it("is fail-safe when preferences cannot be read", async () => {
    const { client } = fakeSupabase({ preferencesError: { message: "db down" } });
    const channels = await resolveChannels(client, {
      userId: "user-1",
      module: "projects",
    });
    expect(channels).toEqual({ email: true, in_app: true });
  });

  it("ignores undeliverable channels such as sms", async () => {
    const { client } = fakeSupabase({
      preferences: [{ channel: "sms", enabled: false }],
    });
    const channels = await resolveChannels(client, {
      userId: "user-1",
      module: "projects",
    });
    expect(channels).toEqual({ email: true, in_app: true });
  });
});

describe("worker insertNotification (NOTIF-P1-001/002)", () => {
  it("suppresses in-app inserts when disabled", async () => {
    const { client, inserts } = fakeSupabase({
      preferences: [{ channel: "in_app", enabled: false }],
    });
    const result = await insertNotification(client, input);
    expect(result.suppressed).toBe(true);
    expect(result.inserted).toBe(false);
    expect(inserts).toHaveLength(0);
  });

  it("sets a notification_key and dedupes identical retries", async () => {
    const { client, inserts, seenKeys } = fakeSupabase({ preferences: [] });

    const first = await insertNotification(client, input);
    const second = await insertNotification(client, input);

    expect(first.inserted).toBe(true);
    expect(second.inserted).toBe(false);
    expect(second.deduped).toBe(true);
    expect(inserts[0].notification_key).toBe(
      buildNotificationKey({
        userId: input.userId,
        module: input.module,
        moduleId: input.moduleId,
        action: input.action,
        title: input.title,
        body: input.body,
      }),
    );
    expect(seenKeys.size).toBe(1);
  });

  it("produces distinct keys for distinct events on the same module", () => {
    const a = buildNotificationKey({ ...input });
    const b = buildNotificationKey({ ...input, body: "a different task body" });
    expect(a).not.toBe(b);
  });
});
