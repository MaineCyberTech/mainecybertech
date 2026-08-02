import { jest } from "@jest/globals";
import request from "supertest";
import adminRouter from "../routes/admin";
import { createTestApp, createMockBuilder } from "./helpers";
import { errorHandler } from "../middleware/error";
import { invalidateCache } from "../middleware/cache";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

jest.mock("../middleware/admin", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../lib/email", () => ({ sendEmail: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";
import { sendEmail } from "../lib/email";

function mockAuth() {
  const supabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@example.com" } },
    error: null,
  });
  return supabase;
}

const app = createTestApp();
app.use("/api/v1/admin", adminRouter);
app.use(errorHandler);

describe("admin routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCache();
  });

  describe("POST /test-email", () => {
    it("returns 200 and sends test email", async () => {
      mockAuth();
      (sendEmail as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .post("/api/v1/admin/test-email")
        .set("Authorization", "Bearer token-123")
        .send({ to: "test@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.data.sent).toBe(true);
      expect(res.body.data.to).toBe("test@example.com");
      expect(sendEmail).toHaveBeenCalledTimes(1);
    });

    it("returns 502 when SMTP is not configured", async () => {
      mockAuth();
      (sendEmail as jest.Mock).mockResolvedValue(false);

      const res = await request(app)
        .post("/api/v1/admin/test-email")
        .set("Authorization", "Bearer token-123")
        .send({ to: "test@example.com" });

      expect(res.status).toBe(502);
    });
  });

  describe("GET /organizations", () => {
    it("lists all organizations for super admins", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValueOnce(
        createMockBuilder({ data: { id: "u1", is_super_admin: true }, error: null }),
      );
      supabase.from.mockReturnValueOnce(
        createMockBuilder({
          data: [
            { id: "o1", name: "Acme Corp", slug: "acme", status: "active" },
            { id: "o2", name: "Beta LLC", slug: "beta", status: "active" },
          ],
          error: null,
        }),
      );

      const res = await request(app)
        .get("/api/v1/admin/organizations")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toBe("Acme Corp");
    });

    it("returns 403 for admins that are not super admins", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValueOnce(
        createMockBuilder({ data: { id: "u1", is_super_admin: false }, error: null }),
      );

      const res = await request(app)
        .get("/api/v1/admin/organizations")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(403);
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });
  });
});
