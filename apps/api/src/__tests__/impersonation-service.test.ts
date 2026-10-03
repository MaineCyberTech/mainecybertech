import { jest } from "@jest/globals";

jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn() }));
jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { getSupabaseAdmin } from "../services/supabase";
import { logImpersonation } from "../services/impersonation";
import { impersonationEventsTotal } from "../lib/metrics";

async function counterValue(actorRoleKey: string, source: string): Promise<number> {
  const metric = await impersonationEventsTotal.get();
  return (
    metric.values.find(
      (v) => v.labels.actor_role_key === actorRoleKey && v.labels.source === source,
    )?.value ?? 0
  );
}

const base = {
  actorUserId: "admin-1",
  actorRoleKey: "super_admin",
  organizationId: "00000000-0000-0000-0000-00000000000b",
};

describe("logImpersonation (ADMIN-P1-002)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("records an insert success on the impersonation metric", async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from: jest.fn(() => ({ insert })) });

    const before = await counterValue("super_admin", "api");
    await logImpersonation({ ...base });
    const after = await counterValue("super_admin", "api");

    expect(insert).toHaveBeenCalledTimes(1);
    expect(after).toBe(before + 1);
  });

  it("is non-blocking and does not count a failed write", async () => {
    const insert = jest.fn().mockResolvedValue({ error: { message: "boom" } });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from: jest.fn(() => ({ insert })) });

    const before = await counterValue("admin", "api");
    await expect(logImpersonation({ ...base, actorRoleKey: "admin" })).resolves.toBeUndefined();
    const after = await counterValue("admin", "api");

    expect(after).toBe(before);
  });
});
