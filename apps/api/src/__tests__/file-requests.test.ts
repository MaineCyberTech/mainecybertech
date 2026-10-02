import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder, type MockResult } from "./helpers";
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
jest.mock("../lib/notify", () => ({ createNotification: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";

const orgA = "00000000-0000-0000-0000-00000000000a";
const orgB = "00000000-0000-0000-0000-00000000000b";
const tokenA = "a".repeat(64);

type StorageMock = {
  from: jest.Mock;
  upload: jest.Mock;
  remove: jest.Mock;
  createSignedUrl: jest.Mock;
};

function mockSupabase(opts: { storage?: StorageMock } = {}) {
  const supabase: {
    from: jest.Mock;
    auth: { getUser: jest.Mock };
    storage: StorageMock;
  } = {
    from: jest.fn(),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
    },
    storage:
      opts.storage ??
      ({
        from: jest.fn().mockReturnThis(),
        upload: jest.fn().mockResolvedValue({ data: { path: "x" }, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        createSignedUrl: jest
          .fn()
          .mockResolvedValue({ data: { signedUrl: "https://signed" }, error: null }),
      } as unknown as StorageMock),
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return supabase;
}

/**
 * Authorization on the PUBLIC upload endpoint is the token alone; the real
 * requireAuth/requireOrgAccess/requirePermission chain still guards the
 * management routes. These suites mount the real middleware stack.
 */
jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireOrgAccessByParam: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
// Management routes (create/list/etc.) legitimately require a permission. The
// public upload endpoint does NOT use requirePermission anymore, so this stub
// no longer masks the anonymous-upload authorization path.
jest.mock("../middleware/permissions", () => ({
  requirePermission:
    () =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
}));

import fileRequestsRouter from "../routes/file-requests";

const app = createTestApp();
app.use("/api/v1/file-requests", fileRequestsRouter);
app.use(errorHandler);

function activeRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: "fr-1",
    organization_id: orgA,
    title: "Upload Bills",
    description: null,
    token: tokenA,
    storage_path: `${orgA}/requests/${tokenA}`,
    max_file_size_mb: 25,
    allowed_mime_types: null,
    max_files: 5,
    upload_count: 0,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    status: "active",
    notify_on_upload: false,
    created_by: "user-1",
    ...overrides,
  };
}

describe("File Requests API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty list", async () => {
    const supabase = mockSupabase();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const res = await request(app).get("/api/v1/file-requests").set("Authorization", "Bearer test-token");
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });

  it("validates required fields on create", async () => {
    mockSupabase();
    const res = await request(app)
      .post("/api/v1/file-requests")
      .set("Authorization", "Bearer test-token")
      .send({});
    expect(res.status).toBe(400);
  });

  it("creates a file request with generated token", async () => {
    const supabase = mockSupabase();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: "fr-1", title: "Upload Bills", token: "ab" + "0".repeat(62), status: "active" },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/file-requests")
      .set("Authorization", "Bearer test-token")
      .send({ organizationId: orgA, title: "Upload Bills" });
    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.token.length).toBeGreaterThan(10);
  });

  it("returns public info for valid token", async () => {
    const supabase = mockSupabase();
    supabase.from.mockReturnValue(createMockBuilder({ data: activeRequest(), error: null }));
    const res = await request(app).get("/api/v1/file-requests/public/test-token");
    expect(res.status).toBe(200);
    expect(res.body.data.maxFiles).toBe(5);
  });

  describe("public upload authorization and storage scoping", () => {
    /**
     * Serve the file_requests lookup, the increment update, and the upload-row
     * insert so the route's multi-query flow can be asserted end to end.
     */
    function mockUploadFlow(requestRow = activeRequest()) {
      const requestBuilder = createMockBuilder({ data: requestRow, error: null } as MockResult);
      const uploadInsert = createMockBuilder({ data: { id: "upload-1" }, error: null } as MockResult);
      const updateBuilder = createMockBuilder({
        data: { id: requestRow.id, upload_count: (requestRow.upload_count as number) + 1 },
        error: null,
      } as MockResult);
      const deleteBuilder = createMockBuilder({ data: null, error: null } as MockResult);

      // The token read is a SELECT; the slot claim is an UPDATE on the same
      // table. Split them so the update resolves to the incremented row.
      requestBuilder.update = jest.fn(() => updateBuilder);

      const storage: StorageMock = {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn().mockResolvedValue({ data: { path: "x" }, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: "https://signed" }, error: null }),
      };

      const supabase = mockSupabase({ storage });
      supabase.from.mockImplementation((table: string) => {
        if (table === "file_requests") return requestBuilder;
        if (table === "file_request_uploads") return uploadInsert;
        return deleteBuilder;
      });

      return { supabase, requestBuilder, uploadInsert, updateBuilder, storage };
    }

    it("accepts an anonymous token upload and writes an org-parseable path plus a DB row", async () => {
      const { supabase, uploadInsert, storage } = mockUploadFlow(activeRequest());

      const res = await request(app)
        .post(`/api/v1/file-requests/public/${tokenA}/upload`)
        .attach("file", Buffer.from("%pdf-1.4 test"), "invoice.pdf");

      expect(res.status).toBe(200);
      expect(res.body.data.uploaded).toBe(true);

      // Object path must BEGIN with the owning org UUID so the
      // storage_path_org_id RLS helper can derive the tenant.
      expect(storage.upload).toHaveBeenCalledTimes(1);
      const [uploadedPath] = storage.upload.mock.calls[0] as [string];
      expect(uploadedPath.startsWith(`${orgA}/requests/${tokenA}/`)).toBe(true);
      expect(uploadedPath).not.toContain("uploads/requests");

      // A DB row must exist so orphan cleanup does not delete the object.
      expect(supabase.from).toHaveBeenCalledWith("file_request_uploads");
      const inserted = uploadInsert.insert.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(inserted).toMatchObject({
        file_request_id: "fr-1",
        organization_id: orgA,
        storage_path: uploadedPath,
      });
    });

    it("derives the org from the token row, not from caller-supplied org headers/body (cross-org write rejection)", async () => {
      const { storage } = mockUploadFlow(activeRequest({ organization_id: orgB }));

      const res = await request(app)
        .post(`/api/v1/file-requests/public/${tokenA}/upload`)
        .set("X-Active-Org", orgA)
        .field("organizationId", orgA)
        .attach("file", Buffer.from("%pdf-1.4 test"), "invoice.pdf");

      expect(res.status).toBe(200);
      const [uploadedPath] = storage.upload.mock.calls[0] as [string];
      // Even though the caller claims org A, the token belongs to org B and the
      // write must land in org B's folder — the capability is the token.
      expect(uploadedPath.startsWith(`${orgB}/requests/${tokenA}/`)).toBe(true);
      expect(uploadedPath.startsWith(`${orgA}/`)).toBe(false);
    });

    it("rejects an expired token without writing anything", async () => {
      const { storage } = mockUploadFlow(
        activeRequest({ expires_at: new Date(Date.now() - 1000).toISOString() }),
      );

      const res = await request(app)
        .post(`/api/v1/file-requests/public/${tokenA}/upload`)
        .attach("file", Buffer.from("%pdf-1.4 test"), "invoice.pdf");

      expect(res.status).toBe(410);
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it("rejects markup content even when the declared MIME is allowed", async () => {
      mockUploadFlow(activeRequest({ allowed_mime_types: ["text/plain"] }));

      const res = await request(app)
        .post(`/api/v1/file-requests/public/${tokenA}/upload`)
        .attach("file", Buffer.from("<html><script>alert(1)</script></html>"), "evil.txt");

      expect(res.status).toBe(400);
    });
  });
});
