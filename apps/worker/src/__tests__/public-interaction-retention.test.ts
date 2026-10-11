import { jest } from "@jest/globals";

/**
 * DATA-P2-006: the public-interaction PII purge must take its window from the
 * active `retention_policies` registry (an explicit payload window still wins)
 * and must refuse a non-positive window instead of setting the cutoff to
 * "now" and wiping the table.
 */

jest.mock("pino", () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return jest.fn(() => mockLogger);
});

jest.mock("dotenv/config", () => ({}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

type PolicyRow = {
  system_name?: string | null;
  data_category?: string | null;
  retention_period_days?: number | null;
};

interface ClientOpts {
  policies?: PolicyRow[];
  policiesError?: boolean;
  deletedIds?: string[];
}

function makeClient(opts: ClientOpts = {}) {
  const fromCalls: string[] = [];
  const ltCutoffs: string[] = [];

  return {
    fromCalls,
    ltCutoffs,
    from(table: string) {
      fromCalls.push(table);
      let deleting = false;
      const api = {
        select() {
          return api;
        },
        delete() {
          deleting = true;
          return api;
        },
        eq() {
          return api;
        },
        lt(_col: string, cutoff: string) {
          ltCutoffs.push(cutoff);
          return api;
        },
        then(resolve: (value: { data: unknown[]; error: unknown }) => unknown) {
          if (table === "retention_policies") {
            if (opts.policiesError) {
              return Promise.resolve({
                data: [],
                error: { message: "registry unavailable" },
              }).then(resolve);
            }
            return Promise.resolve({ data: opts.policies ?? [], error: null }).then(resolve);
          }
          if (deleting) {
            return Promise.resolve({
              data: (opts.deletedIds ?? []).map((id) => ({ id })),
              error: null,
            }).then(resolve);
          }
          return Promise.resolve({ data: [], error: null }).then(resolve);
        },
      };
      return api;
    },
  };
}

import { getSupabaseAdmin } from "../services/supabase";
import { publicInteractionRetention } from "../tasks/public-interaction-retention";

const cutoffDays = (cutoff: string) =>
  (Date.now() - new Date(cutoff).getTime()) / (24 * 60 * 60 * 1000);

describe("publicInteractionRetention (DATA-P2-006)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("refuses a non-positive payload window before touching the database", async () => {
    for (const bad of [0, -5, Number.NaN]) {
      const res = await publicInteractionRetention({ retentionDays: bad });
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/positive number of days/);
    }
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("uses a matching retention_policies window (30 days) over the 90-day default", async () => {
    const client = makeClient({
      policies: [
        {
          system_name: "Contact Form",
          data_category: "Public Interactions",
          retention_period_days: 30,
        },
      ],
      deletedIds: ["pi-1"],
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(client);

    const res = await publicInteractionRetention({});

    expect(res.ok).toBe(true);
    expect(client.fromCalls).toContain("retention_policies");
    expect(client.ltCutoffs).toHaveLength(1);
    expect(cutoffDays(client.ltCutoffs[0])).toBeGreaterThan(29);
    expect(cutoffDays(client.ltCutoffs[0])).toBeLessThan(31);
  });

  it("falls back to the 90-day default when no policy matches", async () => {
    const client = makeClient({ policies: [], deletedIds: [] });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(client);

    const res = await publicInteractionRetention({});

    expect(res.ok).toBe(true);
    expect(cutoffDays(client.ltCutoffs[0])).toBeGreaterThan(89);
    expect(cutoffDays(client.ltCutoffs[0])).toBeLessThan(91);
  });

  it("falls back to the default when the registry read fails", async () => {
    const client = makeClient({ policiesError: true, deletedIds: [] });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(client);

    const res = await publicInteractionRetention({});

    expect(res.ok).toBe(true);
    expect(cutoffDays(client.ltCutoffs[0])).toBeGreaterThan(89);
    expect(cutoffDays(client.ltCutoffs[0])).toBeLessThan(91);
  });
});
