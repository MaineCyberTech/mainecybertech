import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder, createOrgAccessStub } from "./helpers";
import { errorHandler } from "../middleware/error";

/**
 * ACM-P3-008 / SEC-P3-013: the registerCrud reads and the final/* module
 * routes were mounted behind only requireAuth+requireOrgAccess, so any
 * approved org member could read module data without the catalog's view
 * grant. These tests run the real requireAuth/requirePermission chain (only
 * org-access is stubbed) to prove the read/compute surfaces are gated by
 * `${module}:view`.
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
import finalRouter from "../routes/final";
import slaRouter from "../routes/sla";
import { clearPermissionCache } from "../lib/permissions";

const ORG = "00000000-0000-0000-0000-000000000001";

function membershipRow() {
  return {
    id: "m-1",
    organization_id: ORG,
    role_id: "role-a",
    status: "approved",
    roles: { key: "client_user" },
  };
}

function mockSupabase(grantedKeys: string[]) {
  const supabase = {
    from: jest.fn((table: string) => {
      switch (table) {
        case "profiles":
          return createMockBuilder({ data: { id: "user-1", is_super_admin: false }, error: null });
        case "memberships":
          return createMockBuilder({ data: [membershipRow()], error: null });
        case "role_permissions":
          return createMockBuilder({
            data: grantedKeys.map((_key, index) => ({
              role_id: "role-a",
              permission_id: `p${index}`,
            })),
            error: null,
          });
        case "user_permission_overrides":
          return createMockBuilder({ data: [], error: null });
        case "permissions":
          return createMockBuilder({
            data: grantedKeys.map((key, index) => {
              const [module_key, action_key] = key.split(":");
              return { id: `p${index}`, module_key, action_key, description: null };
            }),
            error: null,
          });
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
app.use("/api/v1/final", finalRouter);
app.use("/api/v1/sla", slaRouter);
app.use(errorHandler);

const auth = "Bearer test-token";

type GatedRead = {
  method: "get" | "post";
  url: string;
  module: string;
  body?: Record<string, unknown>;
};

/** Read/compute surfaces that must carry a `module:view` gate. */
const GATED_READS: GatedRead[] = [
  { method: "get", url: `/api/v1/final/sharepoint?organization_id=${ORG}`, module: "sharepoint" },
  {
    method: "get",
    url: `/api/v1/final/sharepoint/sp-1?organization_id=${ORG}`,
    module: "sharepoint",
  },
  { method: "get", url: `/api/v1/final/backups/stats?organization_id=${ORG}`, module: "backup-dr" },
  {
    method: "get",
    url: `/api/v1/final/backups/risk-analysis?organization_id=${ORG}`,
    module: "backup-dr",
  },
  { method: "get", url: `/api/v1/final/budgets/analysis?organization_id=${ORG}`, module: "budgets" },
  {
    method: "get",
    url: `/api/v1/final/time-entries/summary?organization_id=${ORG}`,
    module: "time-entries",
  },
  {
    method: "post",
    url: `/api/v1/final/procurement/compare?organization_id=${ORG}`,
    module: "procurement",
    body: { quoteIds: ["q-1", "q-2"] },
  },
  { method: "get", url: `/api/v1/sla/metrics?organization_id=${ORG}`, module: "sla" },
];

function call(entry: GatedRead) {
  const req = request(app)[entry.method](entry.url).set("Authorization", auth);
  return entry.body ? req.send(entry.body) : req;
}

describe("final/* read gates (ACM-P3-008 / SEC-P3-013)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearPermissionCache();
  });

  it.each(GATED_READS)(
    "denies $method $url without $module:view",
    async (entry) => {
      mockSupabase(["tickets:view"]);

      const res = await call(entry);

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe("FORBIDDEN");
    },
  );

  it.each(GATED_READS)(
    "allows $method $url with $module:view",
    async (entry) => {
      mockSupabase([`${entry.module}:view`]);

      const res = await call(entry);

      expect(res.status).toBe(200);
    },
  );
});
