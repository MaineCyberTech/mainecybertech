import { jest } from "@jest/globals";
import request from "supertest";
import documentsRouter from "../routes/documents";
import { createTestApp, createMockBuilder, type MockResult  } from "./helpers";
import { invalidateCache } from "../middleware/cache";
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
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";

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
app.use("/api/v1/documents", documentsRouter);
app.use(errorHandler);

function mockSupabase() {
  const mock: {
    from: jest.Mock;
    auth: { getUser: jest.Mock };
    storage?: { from: jest.Mock };
  } = {
    from: jest.fn(),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "00000000-0000-0000-0000-000000000777", email: "test@example.com" } },
        error: null,
      }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);
  return mock;
}

function mockFrom(result: MockResult) {
  const mock = mockSupabase();
  const builder = createMockBuilder(result);
  mock.from.mockReturnValue(builder);
  return { mock, builder };
}

const DOCUMENT = {
  id: "00000000-0000-0000-0000-000000000040",
  organization_id: "00000000-0000-0000-0000-000000000001",
  name: "Test Document",
  description: "A test",
  visibility: "org",
  folder_path: null,
  storage_bucket: "documents",
  storage_path: "orgs/org-1/file.pdf",
  mime_type: "application/pdf",
  file_name: "file.pdf",
  file_size: 1024,
  uploaded_by: "user-1",
  current_version: 1,
  metadata: {},
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("documents routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCache();
  });

  describe("GET /", () => {
    it("returns a paginated list of documents", async () => {
      const result: MockResult = { data: [DOCUMENT], error: null, count: 1 };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/documents")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });

    it("returns empty list when no documents", async () => {
      const result: MockResult = { data: [], error: null, count: 0 };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/documents")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
    });
  });

  describe("GET /:id", () => {
    it("returns a document by id", async () => {
      const result: MockResult = { data: DOCUMENT, error: null };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/documents/00000000-0000-0000-0000-000000000040")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("00000000-0000-0000-0000-000000000040");
    });

    it("returns 404 when document not found", async () => {
      const result: MockResult = { data: null, error: new Error("Not found") };
      mockFrom(result);

      const res = await request(app)
        .get("/api/v1/documents/00000000-0000-0000-0000-000000000999")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    it("creates a document and returns 201", async () => {
      const newDoc = { ...DOCUMENT, id: "doc-new" };
      const result: MockResult = { data: newDoc, error: null };
      mockFrom(result);

      const res = await request(app)
        .post("/api/v1/documents")
        .set("Authorization", "Bearer token-123")
        .send({
          organizationId: "00000000-0000-0000-0000-000000000001",
          name: "New Doc",
          visibility: "org",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe("doc-new");
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "document.create" }),
      );
    });

    it("returns 400 when name missing", async () => {
      mockFrom({ data: null, error: null });

      const res = await request(app)
        .post("/api/v1/documents")
        .set("Authorization", "Bearer token-123")
        .send({ organizationId: "00000000-0000-0000-0000-000000000001" });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /:id", () => {
    it("updates a document", async () => {
      const updated = { ...DOCUMENT, name: "Updated Name" };
      const result: MockResult = { data: updated, error: null };
      mockFrom(result);

      const res = await request(app)
        .patch("/api/v1/documents/00000000-0000-0000-0000-000000000040")
        .set("Authorization", "Bearer token-123")
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated Name");
    });

    it("returns 404 when document not found", async () => {
      const result: MockResult = { data: null, error: null };
      mockFrom(result);

      const res = await request(app)
        .patch("/api/v1/documents/00000000-0000-0000-0000-000000000999")
        .set("Authorization", "Bearer token-123")
        .send({ name: "Updated" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /:id", () => {
    it("deletes a document and cleans up storage", async () => {
      const supabase = mockSupabase();
      supabase.storage = {
        from: jest.fn().mockReturnValue({
          remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };

      supabase.from
        .mockReturnValueOnce(
          createMockBuilder({
            data: {
              storage_bucket: "documents",
              storage_path: "orgs/org-1/file.pdf",
            },
            error: null,
          } as MockResult),
        )
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null } as MockResult));

      const res = await request(app)
        .delete("/api/v1/documents/00000000-0000-0000-0000-000000000040")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(204);
      expect(supabase.storage.from).toHaveBeenCalledWith("documents");
      expect(supabase.storage.from("documents").remove).toHaveBeenCalledWith([
        "orgs/org-1/file.pdf",
      ]);
    });

    it("deletes without storage cleanup when no storage references", async () => {
      const supabase = mockSupabase();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: { storage_bucket: null, storage_path: null },
          error: null,
        } as MockResult),
      );

      const res = await request(app)
        .delete("/api/v1/documents/00000000-0000-0000-0000-000000000040")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(204);
    });

    it("returns 404 when document not found", async () => {
      const { mock } = mockFrom({ data: null, error: new Error("Not found") } as MockResult);

      const res = await request(app)
        .delete("/api/v1/documents/00000000-0000-0000-0000-000000000999")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /:id/signed-url", () => {
    it("returns a signed URL for a document with storage", async () => {
      const supabase = mockSupabase();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: {
            storage_bucket: "documents",
            storage_path: "orgs/org-1/file.pdf",
          },
          error: null,
        } as MockResult),
      );
      supabase.storage = {
        from: jest.fn().mockReturnValue({
          createSignedUrl: jest.fn().mockResolvedValue({
            data: { signedUrl: "https://example.com/signed" },
            error: null,
          }),
        }),
      };

      const res = await request(app)
        .post("/api/v1/documents/00000000-0000-0000-0000-000000000040/signed-url")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.signedUrl).toBe("https://example.com/signed");
    });

    it("returns 400 when document has no storage reference", async () => {
      mockFrom({
        data: { storage_bucket: null, storage_path: null },
        error: null,
      } as MockResult);

      const res = await request(app)
        .post("/api/v1/documents/00000000-0000-0000-0000-000000000040/signed-url")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(400);
    });
  });

  describe("POST /upload", () => {
    it("uploads a file and creates a document", async () => {
      const newDoc = { ...DOCUMENT, id: "uploaded-doc" };
      const builder = createMockBuilder({
        data: newDoc,
        error: null,
      } as MockResult);

      const supabase = mockSupabase();
      supabase.from.mockReturnValue(builder);
      supabase.storage = {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ data: { path: "new-path" }, error: null }),
          remove: jest.fn(),
          createSignedUrl: jest.fn(),
        }),
      };

      const res = await request(app)
        .post("/api/v1/documents/upload")
        .set("Authorization", "Bearer token-123")
        .field("organizationId", "00000000-0000-0000-0000-000000000001")
        .field("name", "Uploaded Doc")
        .attach("file", Buffer.from("test content"), "test.txt");

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe("uploaded-doc");
      expect(supabase.storage.from).toHaveBeenCalledWith("documents");
      expect(supabase.storage.from("documents").upload).toHaveBeenCalled();
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "document.create" }),
      );
    });

    it("returns 400 when no file provided", async () => {
      mockSupabase();

      const res = await request(app)
        .post("/api/v1/documents/upload")
        .set("Authorization", "Bearer token-123")
        .field("organizationId", "00000000-0000-0000-0000-000000000001")
        .field("name", "No File");

      expect(res.status).toBe(400);
    });

    it("replaces file on existing document when documentId provided", async () => {
      const existingDoc = {
        id: "00000000-0000-0000-0000-000000000040",
        organization_id: "00000000-0000-0000-0000-000000000001",
        storage_bucket: "documents",
        storage_path: "old/path.pdf",
        current_version: 2,
      };
      const updatedDoc = {
        ...existingDoc,
        storage_path: "new/path.pdf",
        current_version: 3,
      };

      const supabase = mockSupabase();
      supabase.from
        .mockReturnValueOnce(createMockBuilder({ data: existingDoc, error: null } as MockResult))
        .mockReturnValueOnce(createMockBuilder({ data: updatedDoc, error: null } as MockResult))
        .mockReturnValueOnce(createMockBuilder({ data: null, error: null } as MockResult));
      supabase.storage = {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ data: { path: "new/path.pdf" }, error: null }),
          remove: jest.fn().mockResolvedValue({ data: null, error: null }),
          createSignedUrl: jest.fn(),
        }),
      };

      const res = await request(app)
        .post("/api/v1/documents/upload")
        .set("Authorization", "Bearer token-123")
        .field("organizationId", "00000000-0000-0000-0000-000000000001")
        .field("name", "Replaced Doc")
        .field("documentId", "00000000-0000-0000-0000-000000000040")
        .field("currentVersion", "2")
        .attach("file", Buffer.from("new content"), "new.txt");

      expect(res.status).toBe(200);
      expect(supabase.storage.from("documents").remove).toHaveBeenCalledWith(["old/path.pdf"]);
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "document.update" }),
      );
    });

    it("returns 400 when organizationId missing", async () => {
      mockSupabase();

      const res = await request(app)
        .post("/api/v1/documents/upload")
        .set("Authorization", "Bearer token-123")
        .field("name", "No Org")
        .attach("file", Buffer.from("test content"), "test.txt");

      expect(res.status).toBe(400);
    });

    it("returns 500 when storage upload fails", async () => {
      const supabase = mockSupabase();
      supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null } as MockResult));
      supabase.storage = {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Storage full" },
          }),
          remove: jest.fn(),
          createSignedUrl: jest.fn(),
        }),
      };

      const res = await request(app)
        .post("/api/v1/documents/upload")
        .set("Authorization", "Bearer token-123")
        .field("organizationId", "00000000-0000-0000-0000-000000000001")
        .field("name", "Fail Upload")
        .attach("file", Buffer.from("test content"), "test.txt");

      expect(res.status).toBe(500);
    });
  });

  describe("by-id tenant scoping", () => {
    const ORG = "00000000-0000-0000-0000-000000000001";

    it("GET /:id/versions returns 404 when the parent document is in another org", async () => {
      const supabase = mockSupabase();
      supabase.from.mockReturnValue(
        createMockBuilder({ data: null, error: new Error("not found") } as MockResult),
      );

      const res = await request(app)
        .get(`/api/v1/documents/00000000-0000-0000-0000-000000000040/versions?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });

    it("GET /:id/versions scopes the parent document lookup to the caller's org", async () => {
      const supabase = mockSupabase();
      const builder = createMockBuilder({ data: [{ id: "v1" }], error: null, count: 1 } as MockResult);
      supabase.from.mockReturnValue(builder);

      const res = await request(app)
        .get(`/api/v1/documents/00000000-0000-0000-0000-000000000040/versions?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(builder.eq).toHaveBeenCalledWith("organization_id", ORG);
    });

    it("GET /:id/versions/:versionId returns 404 when the parent document is in another org", async () => {
      const supabase = mockSupabase();
      supabase.from.mockReturnValue(
        createMockBuilder({ data: null, error: new Error("not found") } as MockResult),
      );

      const res = await request(app)
        .get(
          `/api/v1/documents/00000000-0000-0000-0000-000000000040/versions/v-1?organization_id=${ORG}`,
        )
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });

    it("POST /bulk/folder only updates documents owned by the caller's org", async () => {
      const supabase = mockSupabase() as any;
      supabase.rpc = jest.fn().mockResolvedValue({
        data: [{ id: "00000000-0000-0000-0000-000000000101", success: true }],
        error: null,
      });
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: [{ id: "00000000-0000-0000-0000-000000000101" }],
          error: null,
        } as MockResult),
      );

      const res = await request(app)
        .post(`/api/v1/documents/bulk/folder?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123")
        .send({
          documentIds: [
            "00000000-0000-0000-0000-000000000101",
            "00000000-0000-0000-0000-000000000102",
          ],
          folderPath: "/new",
        });

      expect(res.status).toBe(200);
      expect(supabase.rpc).toHaveBeenCalledWith(
        "bulk_update_with_version",
        expect.objectContaining({
          table_name: "documents",
          updates: [
            { id: "00000000-0000-0000-0000-000000000101", data: { folder_path: "/new" } },
          ],
        }),
      );
      // The victim id from another org must be filtered out before the RPC
      expect(JSON.stringify(supabase.rpc.mock.calls[0])).not.toContain(
        "00000000-0000-0000-0000-000000000102",
      );
    });

    it("POST /bulk/metadata only updates documents owned by the caller's org", async () => {
      const supabase = mockSupabase() as any;
      supabase.rpc = jest.fn().mockResolvedValue({
        data: [{ id: "00000000-0000-0000-0000-000000000101", success: true }],
        error: null,
      });
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: [{ id: "00000000-0000-0000-0000-000000000101" }],
          error: null,
        } as MockResult),
      );

      const res = await request(app)
        .post(`/api/v1/documents/bulk/metadata?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123")
        .send({
          documentIds: [
            "00000000-0000-0000-0000-000000000101",
            "00000000-0000-0000-0000-000000000102",
          ],
          description: "Updated",
        });

      expect(res.status).toBe(200);
      expect(supabase.rpc).toHaveBeenCalledWith(
        "bulk_update_with_version",
        expect.objectContaining({
          updates: [
            { id: "00000000-0000-0000-0000-000000000101", data: { description: "Updated" } },
          ],
        }),
      );
    });

    it("POST /upload with a cross-org documentId returns 404 and never removes the victim's storage object", async () => {
      const supabase = mockSupabase();
      supabase.from.mockReturnValue(
        createMockBuilder({ data: null, error: new Error("not found") } as MockResult),
      );
      const removeMock = jest.fn().mockResolvedValue({ data: null, error: null });
      supabase.storage = {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ data: { path: "new/path.pdf" }, error: null }),
          remove: removeMock,
          createSignedUrl: jest.fn(),
        }),
      };

      const res = await request(app)
        .post(`/api/v1/documents/upload?organization_id=${ORG}`)
        .set("Authorization", "Bearer token-123")
        .field("organizationId", ORG)
        .field("name", "Replaced Doc")
        .field("documentId", "00000000-0000-0000-0000-000000000099")
        .attach("file", Buffer.from("new content"), "new.txt");

      expect(res.status).toBe(404);
      // The version-replace cleanup removes only the freshly uploaded object,
      // never the victim document's storage object.
      const removedPaths = removeMock.mock.calls.flat();
      expect(removedPaths).not.toContain("old/path.pdf");
    });
  });
});
