import { jest } from "@jest/globals";
import crypto from "crypto";
import request from "supertest";
import { createTestApp, createMockBuilder, createOrgAccessStub } from "./helpers";
import { errorHandler } from "../middleware/error";

/**
 * ACM-P3-006: GET /api-keys was readable by any org member. These tests run the
 * real requireAuth/requirePermission chain (only org-access is stubbed) to
 * prove the list route is gated by `api-keys:view` — including the API-key
 * scope cap from SEC-P2-004.
 */

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    JWT_SECRET: "test-jwt-secret",
    API_PORT: 4000,
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));

jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

jest.mock("../middleware/org-access", () =>
  createOrgAccessStub("00000000-0000-0000-0000-000000000001"),
);

import { getSupabaseAdmin } from "../services/supabase";
import apiKeysRouter from "../routes/api-keys";
import { clearPermissionCache } from "../lib/permissions";

const ORG = "00000000-0000-0000-0000-000000000001";
const API_KEY_TOKEN = `mct_${"a".repeat(64)}`;

function membershipRow() {
  return {
    id: "m-1",
    organization_id: ORG,
    role_id: "role-a",
    status: "approved",
    roles: { key: "client_user" },
  };
}

function apiKeyRow(permissions: string[]) {
  return {
    id: "key-1",
    organization_id: ORG,
    key_hash: crypto.createHash("sha256").update(API_KEY_TOKEN).digest("hex"),
    key_prefix: API_KEY_TOKEN.slice(0, 12),
    permissions,
    expires_at: null,
    is_active: true,
    created_by: "user-1",
  };
}

function mockSupabase(opts: { grantedKeys: string[]; apiKeyRow?: unknown } = { grantedKeys: [] }) {
  const granted = opts.grantedKeys;
  const supabase = {
    from: jest.fn((table: string) => {
      switch (table) {
        case "profiles":
          return createMockBuilder({ data: { id: "user-1", is_super_admin: false }, error: null });
        case "memberships":
          return createMockBuilder({ data: [membershipRow()], error: null });
        case "role_permissions":
          return createMockBuilder({
            data: granted.map((_key, index) => ({
              role_id: "role-a",
              permission_id: `p${index}`,
            })),
            error: null,
          });
        case "user_permission_overrides":
          return createMockBuilder({ data: [], error: null });
        case "permissions":
          return createMockBuilder({
            data: granted.map((key, index) => {
              const [module_key, action_key] = key.split(":");
              return { id: `p${index}`, module_key, action_key, description: null };
            }),
            error: null,
          });
        case "api_keys":
          return createMockBuilder(
            opts.apiKeyRow ? { data: opts.apiKeyRow, error: null } : { data: [], error: null },
          );
        default:
          return createMockBuilder({ data: [], error: null });
      }
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return supabase;
}

const app = createTestApp();
app.use("/api/v1/api-keys", apiKeysRouter);
app.use(errorHandler);

describe("GET /api-keys permission gate (ACM-P3-006)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearPermissionCache();
  });

  it("denies a session member without api-keys:view", async () => {
    mockSupabase({ grantedKeys: ["tickets:view"] });

    const res = await request(app)
      .get(`/api/v1/api-keys?organization_id=${ORG}`)
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe("FORBIDDEN");
  });

  it("allows a session member whose role grants api-keys:view", async () => {
    mockSupabase({ grantedKeys: ["api-keys:view"] });

    const res = await request(app)
      .get(`/api/v1/api-keys?organization_id=${ORG}`)
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("allows an API key scoped with api-keys:view", async () => {
    mockSupabase({
      grantedKeys: ["api-keys:view"],
      apiKeyRow: apiKeyRow(["api-keys:view"]),
    });

    const res = await request(app)
      .get("/api/v1/api-keys")
      .set("Authorization", `Bearer ${API_KEY_TOKEN}`);

    expect(res.status).toBe(200);
  });

  it("denies an API key whose scopes omit api-keys:view", async () => {
    mockSupabase({
      grantedKeys: ["api-keys:view"],
      apiKeyRow: apiKeyRow([]),
    });

    const res = await request(app)
      .get("/api/v1/api-keys")
      .set("Authorization", `Bearer ${API_KEY_TOKEN}`);

    expect(res.status).toBe(403);
    expect(res.body.error?.message).toBe("API key is not scoped for this permission");
  });
});
