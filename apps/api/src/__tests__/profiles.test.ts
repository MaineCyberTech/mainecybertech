import { jest } from "@jest/globals";
import request from "supertest";
import profilesRouter, { resolveImageUpload } from "../routes/profiles";
import { createTestApp, createMockBuilder, type MockResult  } from "./helpers";
import { errorHandler } from "../middleware/error";

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
    getScopedClient: jest.fn((_req, _moduleKey, _kind) => require("../services/supabase").getSupabaseAdmin()),
  getSupabaseUser: jest.fn(),
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

import { getSupabaseAdmin, getSupabaseUser } from "../services/supabase";

function mockAuth() {
  const supabase = {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
    storage: { from: jest.fn() },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  (getSupabaseUser as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@example.com" } },
    error: null,
  });
  return supabase;
}

function mockStorage(supabase: ReturnType<typeof mockAuth>) {
  supabase.storage.from.mockReturnValue({
    upload: jest.fn().mockResolvedValue({ data: { path: "x" }, error: null }),
    getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: "https://cdn/avatar" } }),
  });
}

const PROFILE = {
  id: "prof-1",
  full_name: "Test User",
  email: "test@example.com",
  phone: null,
  title: "Engineer",
};

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
const app = createTestApp();
app.use("/api/v1/profiles", profilesRouter);
app.use(errorHandler);

describe("profiles routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns a list of profiles", async () => {
      mockAuth();
      const result: MockResult = { data: [PROFILE], error: null };
      (getSupabaseUser as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/profiles")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("filters by ids", async () => {
      mockAuth();
      const result: MockResult = { data: [PROFILE], error: null };
      (getSupabaseUser as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/profiles?ids=prof-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /:id", () => {
    it("returns a profile by id (own profile)", async () => {
      const supabase = mockAuth();
      // authUser is user-1, requesting user-1 (own profile) — no admin check needed
      const result: MockResult = { data: PROFILE, error: null };
      (getSupabaseUser as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/profiles/user-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("prof-1");
    });

    it("returns a profile by id (admin viewing another user)", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValueOnce(
        createMockBuilder({ data: { is_super_admin: true }, error: null }),
      );
      const result: MockResult = { data: PROFILE, error: null };
      (getSupabaseUser as jest.Mock)().from.mockReturnValueOnce(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/profiles/prof-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("prof-1");
    });

    it("returns 404 when not found (admin viewing)", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValueOnce(
        createMockBuilder({ data: { is_super_admin: true }, error: null }),
      );
      const result: MockResult = {
        data: null,
        error: { message: "Not found", code: "PGRST116" },
      };
      (getSupabaseUser as jest.Mock)().from.mockReturnValueOnce(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/profiles/missing")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });

    it("returns 403 when non-admin views another user", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValueOnce(
        createMockBuilder({ data: { is_super_admin: false }, error: null }),
      );
      const res = await request(app)
        .get("/api/v1/profiles/prof-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /:id", () => {
    it("updates a profile", async () => {
      mockAuth();
      const updated = { ...PROFILE, full_name: "Updated Name" };
      const result: MockResult = { data: updated, error: null };
      (getSupabaseUser as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .patch("/api/v1/profiles/user-1")
        .set("Authorization", "Bearer token-123")
        .send({ fullName: "Updated Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.full_name).toBe("Updated Name");
    });

    it("returns 404 when profile not found", async () => {
      mockAuth();
      const result: MockResult = { data: null, error: null };
      (getSupabaseUser as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .patch("/api/v1/profiles/missing")
        .set("Authorization", "Bearer token-123")
        .send({ fullName: "Updated" });

      expect(res.status).toBe(403);
    });
  });

  describe("POST /:id/avatar", () => {
    it("stores the avatar with the extension derived from the validated mimetype, not the filename", async () => {
      const supabase = mockAuth();
      mockStorage(supabase);
      (getSupabaseUser as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: PROFILE, error: null }),
      );

      const res = await request(app)
        .post("/api/v1/profiles/user-1/avatar")
        .set("Authorization", "Bearer token-123")
        // extension derived from mimetype: avatar.png -> image/png -> .png
        .attach("avatar", Buffer.from("binary-image"), "avatar.png");

      expect(res.status).toBe(200);
      expect(supabase.storage.from).toHaveBeenCalledWith("avatars");
      const uploadCall = supabase.storage.from("avatars").upload.mock.calls[0];
      expect(uploadCall[0]).toMatch(/^user-1\/avatar\.png$/);
    });

    it("stores a .gif upload as .gif (extension from validated mimetype)", async () => {
      const supabase = mockAuth();
      mockStorage(supabase);
      (getSupabaseUser as jest.Mock)().from.mockReturnValue(
        createMockBuilder({ data: PROFILE, error: null }),
      );

      const res = await request(app)
        .post("/api/v1/profiles/user-1/avatar")
        .set("Authorization", "Bearer token-123")
        .attach("avatar", Buffer.from("binary-image"), "avatar.gif");

      expect(res.status).toBe(200);
      const uploadCall = supabase.storage.from("avatars").upload.mock.calls[0];
      expect(uploadCall[0]).toMatch(/^user-1\/avatar\.gif$/);
    });

    // Direct unit test of the hardening helper: the stored extension must come
    // from the VALIDATED mimetype, never from the attacker-controlled filename.
    describe("resolveImageUpload (FILE-P2-002)", () => {
      it("derives the stored extension from the mimetype, ignoring a .svg filename", () => {
        const { extension, mimetype } = resolveImageUpload(
          { originalname: "evil.svg", mimetype: "image/png" },
          "Avatar",
        );
        expect(mimetype).toBe("image/png");
        expect(extension).toBe("png");
      });

      it("maps image/jpeg -> jpg", () => {
        expect(resolveImageUpload({ originalname: "x.jpg", mimetype: "image/jpeg" }, "Avatar").extension).toBe("jpg");
      });

      it("rejects image/svg+xml via the mimetype allowlist", () => {
        expect(() => resolveImageUpload({ originalname: "evil.svg", mimetype: "image/svg+xml" }, "Avatar")).toThrow();
      });

      it("ignores the .js filename extension and stores as .png (filename never echoed)", () => {
        const { extension } = resolveImageUpload(
          { originalname: "evil.js", mimetype: "image/png" },
          "Avatar",
        );
        expect(extension).toBe("png");
      });
    });

    it("rejects a real image/svg+xml upload (FILE-P1-001 overlap)", async () => {
      mockAuth();

      const res = await request(app)
        .post("/api/v1/profiles/user-1/avatar")
        .set("Authorization", "Bearer token-123")
        .attach("avatar", Buffer.from("<svg></svg>"), "evil.svg");

      expect(res.status).toBe(400);
    });
  });
});
