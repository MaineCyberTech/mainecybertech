import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder } from "./helpers";
import { errorHandler } from "../middleware/error";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    JWT_SECRET: "test-jwt-secret",
    APP_BASE_URL: "http://localhost:3000",
    API_PORT: 4000,
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));

jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock("../middleware/auth", () => ({
  requireAuth: (req: { authUser?: { userId: string } }, _res: unknown, next: () => void) => {
    req.authUser = { userId: "00000000-0000-0000-0000-0000000000aa" };
    next();
  },
}));
jest.mock("../middleware/admin", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import storeRouter from "../routes/store";
import { capacityNotice, isCampaignActive } from "../lib/store-campaigns";

function campaignRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "c-1",
    slug: "marina-preseason",
    name: "Marina Pre-Season Readiness",
    audience: "Marinas",
    headline: "Get ready before the season",
    body: "",
    icon: "Anchor",
    accent: "teal",
    recommended_product_ids: ["p-1"],
    trust_badges: ["local_maine_support"],
    promo_eligibility: ["seasonal_offer"],
    status: "active",
    starts_at: null,
    ends_at: null,
    capacity_enabled: false,
    capacity_total: null,
    capacity_remaining: null,
    capacity_label: "",
    organization_id: null,
    created_at: "2026-09-21T10:00:00.000Z",
    updated_at: "2026-09-21T10:00:00.000Z",
    ...overrides,
  };
}

function setup({
  rows = {},
  failTables = [],
}: { rows?: Record<string, unknown>; failTables?: string[] } = {}) {
  const inserts: Record<string, any> = {};
  const updates: Record<string, any> = {};

  const from = jest.fn((table: string) => {
    const builder = createMockBuilder({ data: null as unknown, error: null });
    let mode: "read" | "write" | "update" | "delete" = "read";

    (builder as any).insert = jest.fn((payload: unknown) => {
      inserts[table] = payload;
      mode = "write";
      return builder;
    });
    (builder as any).update = jest.fn((payload: unknown) => {
      updates[table] = payload;
      mode = "update";
      return builder;
    });
    (builder as any).delete = jest.fn(() => {
      mode = "delete";
      return builder;
    });

    (builder as any).then = (
      onFulfilled?: (v: unknown) => unknown,
      onRejected?: (v: unknown) => unknown,
    ) => {
      const failed = mode !== "read" && failTables.includes(table);
      let data: unknown = null;
      if (!failed) {
        if (mode === "read") data = table in rows ? rows[table] : [campaignRow()];
        else if (mode === "write" || mode === "update") data = campaignRow();
      }
      const result = failed
        ? { data: null, error: { message: `${table} unavailable` } }
        : { data, error: null };
      return Promise.resolve(result).then(onFulfilled as never, onRejected as never);
    };

    return builder;
  });

  (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });
  return { inserts, updates };
}

const app = createTestApp();
app.use("/api/v1/store", storeRouter);
app.use(errorHandler);

describe("campaign capacity guardrail", () => {
  it("returns null when capacity messaging is disabled", () => {
    expect(
      capacityNotice({
        capacity_enabled: false,
        capacity_total: 10,
        capacity_remaining: 3,
        capacity_label: "",
      }),
    ).toBeNull();
  });

  it.each([
    [null, 3],
    [10, null],
    [10, 0],
    [0, 0],
    [10, 11],
  ])(
    "returns null for inconsistent or exhausted numbers (total=%s, remaining=%s)",
    (total, remaining) => {
      expect(
        capacityNotice({
          capacity_enabled: true,
          capacity_total: total as number | null,
          capacity_remaining: remaining as number | null,
          capacity_label: "",
        }),
      ).toBeNull();
    },
  );

  it("derives a truthful default message", () => {
    expect(
      capacityNotice({
        capacity_enabled: true,
        capacity_total: 10,
        capacity_remaining: 4,
        capacity_label: "",
      }),
    ).toBe("4 of 10 spots left");
  });

  it("uses the admin label when provided", () => {
    expect(
      capacityNotice({
        capacity_enabled: true,
        capacity_total: 8,
        capacity_remaining: 2,
        capacity_label: "2 onboarding slots this month",
      }),
    ).toBe("2 onboarding slots this month");
  });
});

describe("isCampaignActive", () => {
  const now = new Date("2026-09-21T12:00:00.000Z");

  it("requires active status", () => {
    expect(isCampaignActive({ status: "draft", starts_at: null, ends_at: null }, now)).toBe(false);
  });

  it("honours the start and end window", () => {
    expect(
      isCampaignActive(
        { status: "active", starts_at: "2026-09-22T00:00:00.000Z", ends_at: null },
        now,
      ),
    ).toBe(false);
    expect(
      isCampaignActive(
        { status: "active", starts_at: null, ends_at: "2026-09-20T00:00:00.000Z" },
        now,
      ),
    ).toBe(false);
    expect(
      isCampaignActive(
        {
          status: "active",
          starts_at: "2026-09-01T00:00:00.000Z",
          ends_at: "2026-10-01T00:00:00.000Z",
        },
        now,
      ),
    ).toBe(true);
  });
});

describe("store campaign routes", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists only active campaigns on the public endpoint", async () => {
    setup({
      rows: {
        store_campaigns: [
          campaignRow({ id: "c-1", status: "active" }),
          campaignRow({ id: "c-2", status: "draft" }),
        ],
      },
    });

    const res = await request(app).get("/api/v1/store/campaigns");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ slug: "marina-preseason", capacityNotice: null });
  });

  it("filters out campaigns outside their window", async () => {
    setup({
      rows: {
        store_campaigns: [
          campaignRow({ ends_at: "2020-01-01T00:00:00.000Z" }),
          campaignRow({ starts_at: "2999-01-01T00:00:00.000Z" }),
        ],
      },
    });

    const res = await request(app).get("/api/v1/store/campaigns");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("exposes the server-computed capacity notice", async () => {
    setup({
      rows: {
        store_campaigns: [
          campaignRow({
            capacity_enabled: true,
            capacity_total: 10,
            capacity_remaining: 4,
          }),
        ],
      },
    });

    const res = await request(app).get("/api/v1/store/campaigns");

    expect(res.body.data[0].capacityNotice).toBe("4 of 10 spots left");
  });

  it("lists all campaigns for admins", async () => {
    setup({
      rows: {
        store_campaigns: [campaignRow({ status: "active" }), campaignRow({ status: "draft" })],
      },
    });

    const res = await request(app).get("/api/v1/store/campaigns/admin");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("creates a campaign with snake_case columns", async () => {
    const { inserts } = setup();

    const res = await request(app)
      .post("/api/v1/store/campaigns")
      .send({
        slug: "backup-readiness",
        name: "Backup Readiness",
        status: "active",
        recommendedProductIds: ["p-1", "p-2"],
        capacityEnabled: true,
        capacityTotal: 5,
        capacityRemaining: 5,
      });

    expect(res.status).toBe(201);
    expect(inserts.store_campaigns).toMatchObject({
      slug: "backup-readiness",
      name: "Backup Readiness",
      status: "active",
      recommended_product_ids: ["p-1", "p-2"],
      capacity_enabled: true,
      capacity_total: 5,
      capacity_remaining: 5,
    });
  });

  it("rejects capacity messaging without a total", async () => {
    setup();

    const res = await request(app).post("/api/v1/store/campaigns").send({
      slug: "bad",
      name: "Bad",
      capacityEnabled: true,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("rejects remaining greater than total", async () => {
    setup();

    const res = await request(app).post("/api/v1/store/campaigns").send({
      slug: "bad",
      name: "Bad",
      capacityEnabled: true,
      capacityTotal: 2,
      capacityRemaining: 5,
    });

    expect(res.status).toBe(400);
  });

  it("updates a campaign", async () => {
    const { updates } = setup();

    const res = await request(app).patch("/api/v1/store/campaigns/c-1").send({ status: "paused" });

    expect(res.status).toBe(200);
    expect(updates.store_campaigns).toMatchObject({ status: "paused" });
  });

  it("rejects an empty campaign update", async () => {
    setup();

    const res = await request(app).patch("/api/v1/store/campaigns/c-1").send({});

    expect(res.status).toBe(400);
  });

  it("deletes a campaign", async () => {
    setup();

    const res = await request(app).delete("/api/v1/store/campaigns/c-1");

    expect(res.status).toBe(204);
  });
});
