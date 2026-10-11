import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder } from "./helpers";
import { errorHandler } from "../middleware/error";

/**
 * SEARCH-P2-008 regression tests.
 *
 * Admin global search reads `documents` with the service-role client, which
 * bypasses RLS, so the `can_read_document` visibility model must be applied in
 * code: private/internal documents are only returned to callers who may read
 * them (uploader, explicit grant, `documents:edit`, or an internal role key),
 * and the reported documents count must not disclose hidden rows.
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
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));
jest.mock("../lib/metrics", () => ({ recordSearchQuery: jest.fn() }));
jest.mock("../middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.authUser = { userId: "user-1", email: "admin@example.com" };
    next();
  },
}));
jest.mock("../middleware/admin", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (req: any, _res: unknown, next: () => void) => {
    req.orgScope = {
      orgId: "00000000-0000-0000-0000-00000000000a",
      explicit: true,
      platformAdmin: false,
      impersonation: false,
    };
    req.orgId = "00000000-0000-0000-0000-00000000000a";
    next();
  },
}));

import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import searchRouter from "../routes/search";

const ORG_A = "00000000-0000-0000-0000-00000000000a";
const ORG_B = "00000000-0000-0000-0000-00000000000b";
const authToken = "Bearer test-token";

const app = createTestApp();
app.use("/api/v1/search", searchRouter);
app.use(errorHandler);

type MembershipSpec = { organization_id: string; role_id?: string | null; role_key: string };

type SearchVisibilityOptions = {
  isSuperAdmin?: boolean;
  memberships?: MembershipSpec[];
  documents?: Array<Record<string, unknown>>;
  /** Role ids whose catalog grants include `documents:edit`. */
  editRoleIds?: string[];
  directGrants?: Array<{ document_id: string }>;
  roleGrants?: Array<{ document_id: string; role_id: string }>;
};

function mockSearch(options: SearchVisibilityOptions) {
  const builders: Record<string, any[]> = {};
  const supabase = {
    from: jest.fn((table: string) => {
      const nth = (builders[table] ??= []).length;
      let data: unknown = [];
      let count: number | undefined;
      switch (table) {
        case "profiles":
          data = nth === 0 ? { is_super_admin: options.isSuperAdmin ?? false } : [];
          break;
        case "memberships":
          // Caller memberships for every membership read: the route reads them
          // twice (caller scope + scoped member ids) and the visibility helper
          // reads them again.
          data = (options.memberships ?? []).map((membership) => ({
            user_id: "user-1",
            organization_id: membership.organization_id,
            role_id: membership.role_id ?? null,
            roles: [{ key: membership.role_key }],
          }));
          break;
        case "documents": {
          const documents = options.documents ?? [];
          data = documents;
          count = documents.length;
          break;
        }
        case "role_permissions":
          data = (options.editRoleIds ?? []).map((roleId) => ({
            role_id: roleId,
            permission_id: "perm-documents-edit",
          }));
          break;
        case "permissions":
          data = [{ id: "perm-documents-edit" }];
          break;
        case "document_permissions":
          data = nth === 0 ? (options.directGrants ?? []) : (options.roleGrants ?? []);
          break;
        default:
          data = [];
      }
      const builder = createMockBuilder({ data, error: null, count });
      builders[table].push(builder);
      return builder;
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "admin@example.com" } },
        error: null,
      }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return builders;
}

const documentRow = (overrides: Record<string, unknown>): Record<string, unknown> => ({
  id: "doc-1",
  name: "acme report",
  mime_type: "application/pdf",
  visibility: "org",
  organization_id: ORG_A,
  uploaded_by: "someone-else",
  ...overrides,
});

describe("Search document visibility (SEARCH-P2-008)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("drops private/internal documents the caller cannot read and reports only readable counts", async () => {
    const privateDoc = documentRow({ id: "doc-private", visibility: "private" });
    const internalDoc = documentRow({ id: "doc-internal", visibility: "internal" });
    const orgDoc = documentRow({ id: "doc-org" });
    const publicDoc = documentRow({ id: "doc-public", visibility: "public" });
    mockSearch({
      memberships: [{ organization_id: ORG_A, role_id: "role-client-user", role_key: "client_user" }],
      documents: [privateDoc, internalDoc, orgDoc, publicDoc],
    });

    const res = await request(app).get("/api/v1/search?q=acme").set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data.documents.map((d: { id: string }) => d.id)).toEqual([
      "doc-org",
      "doc-public",
    ]);
    // The count must never disclose the hidden private/internal rows.
    expect(res.body.data.counts.documents).toBe(2);

    const audit = (logAuditEvent as jest.Mock).mock.calls[0][0] as {
      metadata: { resultCounts: { documents: number } };
    };
    expect(audit.metadata.resultCounts.documents).toBe(2);
  });

  it("keeps a private document uploaded by the caller", async () => {
    mockSearch({
      memberships: [{ organization_id: ORG_A, role_id: "role-client-user", role_key: "client_user" }],
      documents: [documentRow({ id: "doc-private", visibility: "private", uploaded_by: "user-1" })],
    });

    const res = await request(app).get("/api/v1/search?q=acme").set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data.documents.map((d: { id: string }) => d.id)).toEqual(["doc-private"]);
  });

  it("keeps a private document the caller has an explicit document_permissions grant for", async () => {
    mockSearch({
      memberships: [{ organization_id: ORG_A, role_id: "role-client-user", role_key: "client_user" }],
      documents: [documentRow({ id: "doc-private", visibility: "private" })],
      directGrants: [{ document_id: "doc-private" }],
    });

    const res = await request(app).get("/api/v1/search?q=acme").set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data.documents.map((d: { id: string }) => d.id)).toEqual(["doc-private"]);
  });

  it("keeps a private document granted to the caller's role", async () => {
    mockSearch({
      memberships: [{ organization_id: ORG_A, role_id: "role-client-user", role_key: "client_user" }],
      documents: [documentRow({ id: "doc-private", visibility: "private" })],
      roleGrants: [{ document_id: "doc-private", role_id: "role-client-user" }],
    });

    const res = await request(app).get("/api/v1/search?q=acme").set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data.documents.map((d: { id: string }) => d.id)).toEqual(["doc-private"]);
  });

  it("keeps internal documents for a caller whose role has documents:edit", async () => {
    mockSearch({
      memberships: [{ organization_id: ORG_A, role_id: "role-admin-a", role_key: "admin" }],
      documents: [documentRow({ id: "doc-internal", visibility: "internal" })],
      editRoleIds: ["role-admin-a"],
    });

    const res = await request(app).get("/api/v1/search?q=acme").set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data.documents.map((d: { id: string }) => d.id)).toEqual(["doc-internal"]);
  });

  it("drops private/internal documents from an org the caller does not belong to", async () => {
    mockSearch({
      memberships: [{ organization_id: ORG_A, role_id: "role-admin-a", role_key: "admin" }],
      editRoleIds: ["role-admin-a"],
      documents: [
        documentRow({ id: "doc-private-b", visibility: "private", organization_id: ORG_B }),
        documentRow({ id: "doc-internal-b", visibility: "internal", organization_id: ORG_B }),
        documentRow({ id: "doc-org-b", organization_id: ORG_B }),
        documentRow({ id: "doc-public-b", visibility: "public", organization_id: ORG_B }),
      ],
    });

    const res = await request(app).get("/api/v1/search?q=acme").set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data.documents.map((d: { id: string }) => d.id)).toEqual(["doc-public-b"]);
    expect(res.body.data.counts.documents).toBe(1);
  });

  it("keeps every document for a super admin (is_super_admin short-circuit)", async () => {
    mockSearch({
      isSuperAdmin: true,
      memberships: [{ organization_id: ORG_A, role_id: "role-super", role_key: "super_admin" }],
      documents: [
        documentRow({ id: "doc-private", visibility: "private" }),
        documentRow({ id: "doc-internal", visibility: "internal" }),
        documentRow({ id: "doc-org" }),
      ],
    });

    const res = await request(app).get("/api/v1/search?q=acme").set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data.documents.map((d: { id: string }) => d.id)).toEqual([
      "doc-private",
      "doc-internal",
      "doc-org",
    ]);
    // Every document is readable, so the exact DB count is meaningful.
    expect(res.body.data.counts.documents).toBe(3);
  });
});
