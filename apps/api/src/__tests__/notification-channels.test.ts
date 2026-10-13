import { jest } from "@jest/globals";

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

jest.mock("../lib/logger", () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { getSupabaseAdmin } from "../services/supabase";
import { resolveChannels } from "../lib/notification-channels";

/**
 * NOTIF-P3-005/006: the resolver must (a) read the global `module_key='all'`
 * opt-out row alongside the module row, and (b) match the organization exactly
 * when one is known so another org's preference cannot leak across tenants.
 */
function fakeQuery(rows: { channel: string; enabled: boolean }[]) {
  const calls: { in: unknown[][]; eq: unknown[][] } = { in: [], eq: [] };
  const builder: Record<string, unknown> = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn((col: string, value: unknown) => {
    calls.eq.push([col, value]);
    return builder;
  });
  builder.in = jest.fn((col: string, values: unknown) => {
    calls.in.push([col, values]);
    return builder;
  });
  builder.then = (onfulfilled?: (v: unknown) => unknown) =>
    Promise.resolve({ data: rows, error: null }).then(onfulfilled);
  return { builder, calls };
}

function install(rows: { channel: string; enabled: boolean }[]) {
  const { builder, calls } = fakeQuery(rows);
  const supabase = { from: jest.fn().mockReturnValue(builder) };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return { supabase, calls };
}

describe("resolveChannels global opt-out and org scoping (NOTIF-P3-005/006)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reads the module rows AND the global 'all' row", async () => {
    const { calls } = install([]);

    await resolveChannels({ userId: "user-1", organizationId: "org-1", module: "projects" });

    expect(calls.in).toContainEqual(["module_key", ["projects", "all"]]);
  });

  it("suppresses a channel when the global opt-out row is disabled", async () => {
    install([{ channel: "email", enabled: false }]);

    const channels = await resolveChannels({
      userId: "user-1",
      organizationId: "org-1",
      module: "projects",
    });

    expect(channels.email).toBe(false);
    expect(channels.in_app).toBe(true);
  });

  it("matches the organization exactly when one is known", async () => {
    const { calls } = install([]);

    await resolveChannels({ userId: "user-1", organizationId: "org-2", module: "tickets" });

    expect(calls.eq).toContainEqual(["organization_id", "org-2"]);
  });

  it("does not add an org predicate when the org is unknown (fail-safe any-row semantics)", async () => {
    const { calls } = install([]);

    await resolveChannels({ userId: "user-1", module: "tickets" });

    expect(calls.eq.some(([col]) => col === "organization_id")).toBe(false);
  });
});
