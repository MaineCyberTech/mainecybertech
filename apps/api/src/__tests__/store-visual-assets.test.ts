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
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock("../middleware/admin", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import storeRouter from "../routes/store";

const row = {
  id: "va-1",
  linked_entity_type: "category",
  linked_entity_id: "cybersecurity",
  asset_type: "icon",
  icon_name: "shield",
  accent_color: "#059669",
  image_url: "",
  alt_text: "Cybersecurity",
  decorative: false,
  provenance: "internal",
  license_notes: "",
  created_at: "2026-09-21T10:00:00.000Z",
  updated_at: "2026-09-21T10:00:00.000Z",
};

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
        if (mode === "read") data = table in rows ? rows[table] : [row];
        else if (mode === "write" || mode === "update") data = row;
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

describe("store visual assets", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists visual assets in camelCase", async () => {
    setup();

    const res = await request(app).get("/api/v1/store/visual-assets");

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({
      id: "va-1",
      linkedEntityType: "category",
      linkedEntityId: "cybersecurity",
      assetType: "icon",
      iconName: "shield",
      decorative: false,
    });
  });

  it("creates a visual asset", async () => {
    const { inserts } = setup();

    const res = await request(app).post("/api/v1/store/visual-assets").send({
      linkedEntityType: "product",
      linkedEntityId: "password-security-checkup",
      assetType: "image",
      altText: "Password checkup",
    });

    expect(res.status).toBe(201);
    expect(inserts.store_visual_assets).toMatchObject({
      linked_entity_type: "product",
      linked_entity_id: "password-security-checkup",
      asset_type: "image",
      alt_text: "Password checkup",
      decorative: false,
    });
  });

  it("rejects a visual asset without a linked entity", async () => {
    setup();

    const res = await request(app).post("/api/v1/store/visual-assets").send({ assetType: "icon" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("updates a visual asset", async () => {
    const { updates } = setup();

    const res = await request(app)
      .patch("/api/v1/store/visual-assets/va-1")
      .send({ accentColor: "#10b981" });

    expect(res.status).toBe(200);
    expect(updates.store_visual_assets).toMatchObject({ accent_color: "#10b981" });
  });

  it("rejects an empty visual asset update", async () => {
    setup();

    const res = await request(app).patch("/api/v1/store/visual-assets/va-1").send({});

    expect(res.status).toBe(400);
  });

  it("deletes a visual asset", async () => {
    setup();

    const res = await request(app).delete("/api/v1/store/visual-assets/va-1");

    expect(res.status).toBe(204);
  });

  it("surfaces a database error", async () => {
    setup({ failTables: ["store_visual_assets"] });

    const res = await request(app).post("/api/v1/store/visual-assets").send({
      linkedEntityType: "category",
      linkedEntityId: "cybersecurity",
      assetType: "icon",
    });

    expect(res.status).toBe(500);
  });
});
