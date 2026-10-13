import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";
import request from "supertest";
import { createTestApp, createMockBuilder, createOrgAccessStub, tableAwareFrom } from "./helpers";
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
    SMTP_HOST: "",
    EMAIL_FROM: "noreply@test.local",
    SENTRY_DSN: "",
    STRIPE_SECRET_KEY: "",
    STRIPE_WEBHOOK_SECRET: "",
    PUBLIC_TRAFFIC_WEBHOOK_URL: "",
    PUBLIC_LEAD_WEBHOOK_URL: "",
    JSM_DOMAIN: "",
    JSM_EMAIL: "",
    JSM_API_TOKEN: "",
    JSM_SERVICEDESK_ID: "",
    JSM_REQUEST_TYPE_ID: "",
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
jest.mock("../middleware/permissions", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock("../middleware/entitlement", () => ({
  requireEntitlement: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  requireActiveSubscription: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  clearEntitlementCache: jest.fn(),
}));
jest.mock("../middleware/cache", () => ({
  responseCacheNoRenew: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  invalidateCache: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import governanceRouter from "../routes/governance";
import insuranceBinderRouter from "../routes/insurance-binder";
import satisfactionPulseRouter from "../routes/satisfaction-pulse-widget";
import eduAutomationRouter from "../routes/edu-automation";
import finalRouter from "../routes/final";

const authToken = "Bearer test-token";

const app = createTestApp();
app.use("/api/v1/governance", governanceRouter);
app.use("/api/v1/insurance-binder", insuranceBinderRouter);
app.use("/api/v1/satisfaction-pulse", satisfactionPulseRouter);
app.use("/api/v1/edu-automation", eduAutomationRouter);
app.use("/api/v1/final", finalRouter);
app.use(errorHandler);

function mockSupabase() {
  const supabase = {
    from: jest
      .fn()
      .mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null, count: 0 }))),
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

/**
 * FEAT-P2-005: one canonical API surface per table.
 *
 * `sop_library`, `insurance_evidence` and `satisfaction_pulses` were each
 * registered by two route files with divergent validators/lifecycles. This
 * suite guards the consolidation:
 *   1. no route file may register the same table as another route file
 *      (static guard, so a re-introduced duplicate fails CI), and
 *   2. the deprecated paths fail closed with 410 + a successor-version link
 *      while the canonical surfaces serve the table.
 */
describe("canonical API surfaces (FEAT-P2-005)", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("static duplicate-registration guard", () => {
    const ROUTES_DIR = path.join(__dirname, "..", "routes");
    const REGISTRATION_PATTERNS = [
      // `{ schema, table: "..." }` maps (edu-automation / final crud factories).
      /table:\s*"([a-z_]+)"/g,
      // governance crudRoute("path", "table", ...)
      /crudRoute\(\s*"([^"]+)"\s*,\s*"([a-z_]+)"/g,
      // final registerCrud(router, "path", "table", ...)
      /registerCrud\(\s*[\w$]+\s*,\s*"[^"]+"\s*,\s*"([a-z_]+)"/g,
    ];

    function routeFiles(): string[] {
      const files: string[] = [];
      for (const entry of fs.readdirSync(ROUTES_DIR)) {
        const full = path.join(ROUTES_DIR, entry);
        if (fs.statSync(full).isDirectory()) {
          for (const sub of fs.readdirSync(full)) {
            if (sub.endsWith(".ts") && !sub.endsWith(".test.ts") && sub !== "index.ts") {
              files.push(path.join(full, sub));
            }
          }
        } else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts") && entry !== "index.ts") {
          files.push(full);
        }
      }
      return files;
    }

    it("registers every table from exactly one route file", () => {
      const owners = new Map<string, Set<string>>();
      for (const file of routeFiles()) {
        const src = fs.readFileSync(file, "utf8");
        for (const pattern of REGISTRATION_PATTERNS) {
          pattern.lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = pattern.exec(src))) {
            // Pattern 2 has the table in the second capture group.
            const table = match[2] ?? match[1];
            const set = owners.get(table) ?? new Set<string>();
            set.add(path.relative(ROUTES_DIR, file));
            owners.set(table, set);
          }
        }
      }

      const duplicates = [...owners.entries()]
        .filter(([, files]) => files.size > 1)
        .map(([table, files]) => `${table}: ${[...files].join(", ")}`);
      expect(duplicates).toEqual([]);
    });

    it("keeps the three consolidated tables on their canonical owners only", () => {
      const read = (relativePath: string) =>
        fs.readFileSync(path.join(ROUTES_DIR, relativePath), "utf8");

      // sop_library: governance owns it via crudRoute; edu-automation must not
      // register the table anymore (comments may still mention the name).
      expect(read("governance.ts")).toContain(
        'crudRoute(\n  "sop-library",\n  "sop_library"',
      );
      expect(read("edu-automation.ts")).not.toMatch(/table:\s*"sop_library"/);
      expect(read("edu-automation.ts")).not.toContain('from("sop_library")');

      // insurance_evidence: the dedicated binder router owns every query;
      // edu-automation must not register/query the table anymore.
      expect(read("insurance-binder.ts")).toContain('from("insurance_evidence")');
      expect(read("edu-automation.ts")).not.toMatch(/table:\s*"insurance_evidence"/);
      expect(read("edu-automation.ts")).not.toContain('from("insurance_evidence")');

      // satisfaction_pulses: the widget router (via its service) owns it;
      // final/crud.ts must not register the table.
      expect(
        fs.readFileSync(
          path.join(ROUTES_DIR, "..", "services", "satisfaction-pulse-widget.ts"),
          "utf8",
        ),
      ).toContain('from("satisfaction_pulses")');
      expect(read("satisfaction-pulse-widget.ts")).toContain("listSatisfactionPulses");
      expect(read(path.join("final", "crud.ts"))).not.toMatch(/table:\s*"satisfaction_pulses"/);
    });
  });

  describe("deprecated duplicates fail closed with a successor link", () => {
    const deprecated = [
      ["/api/v1/edu-automation/sop", "/api/v1/governance/sop-library"],
      ["/api/v1/edu-automation/sop/sop-1", "/api/v1/governance/sop-library"],
      ["/api/v1/edu-automation/insurance", "/api/v1/insurance-binder"],
      ["/api/v1/edu-automation/insurance/ev-1", "/api/v1/insurance-binder"],
      ["/api/v1/final/satisfaction", "/api/v1/satisfaction-pulse"],
      ["/api/v1/final/satisfaction/sp-1", "/api/v1/satisfaction-pulse"],
    ] as const;

    for (const [deprecatedPath, canonicalPath] of deprecated) {
      it(`410s ${deprecatedPath} and points at ${canonicalPath}`, async () => {
        mockSupabase();
        const res = await request(app).get(deprecatedPath).set("Authorization", authToken);
        expect(res.status).toBe(410);
        expect(res.headers.deprecation).toBe("true");
        expect(res.headers.link).toContain(`<${canonicalPath}>; rel="successor-version"`);
        expect(res.body.error.code).toBe("GONE");
      });
    }
  });

  describe("canonical surfaces serve the consolidated tables", () => {
    const canonical = [
      "/api/v1/governance/sop-library",
      "/api/v1/insurance-binder",
      "/api/v1/satisfaction-pulse",
    ] as const;

    for (const canonicalPath of canonical) {
      it(`serves ${canonicalPath}`, async () => {
        mockSupabase();
        const res = await request(app).get(canonicalPath).set("Authorization", authToken);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    }
  });
});
