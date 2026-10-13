import { jest } from "@jest/globals";

/**
 * Unit tests for the `can_read_document` mirror (FILE-P2-007 / SEARCH-P2-008).
 * The predicate itself is pure; only the scope resolvers touch Supabase, so
 * the service is mocked to keep the import graph side-effect free.
 */

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    LOG_LEVEL: "silent",
  }),
}));
jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn() }));

import {
  canReadDocument,
  type DocumentReadScope,
  type DocumentVisibilityFields,
} from "../lib/document-visibility";

const ORG_A = "00000000-0000-0000-0000-00000000000a";
const ORG_B = "00000000-0000-0000-0000-00000000000b";

function scope(overrides: Partial<DocumentReadScope> = {}): DocumentReadScope {
  return {
    userId: "user-1",
    isSuperAdmin: false,
    memberOrgIds: new Set(),
    editOrgIds: new Set(),
    roleKeysByOrg: new Map(),
    roleIdsByOrg: new Map(),
    directGrantDocumentIds: new Set(),
    roleGrantDocumentIds: new Map(),
    ...overrides,
  };
}

const doc = (overrides: Partial<DocumentVisibilityFields> = {}): DocumentVisibilityFields => ({
  id: "doc-1",
  organization_id: ORG_A,
  visibility: "org",
  uploaded_by: "someone-else",
  ...overrides,
});

describe("canReadDocument (can_read_document mirror)", () => {
  it("fails closed for an unknown or missing visibility", () => {
    expect(canReadDocument(scope(), doc({ visibility: "mystery" }))).toBe(false);
    expect(canReadDocument(scope(), doc({ visibility: null }))).toBe(false);
    expect(canReadDocument(scope(), doc({ visibility: undefined }))).toBe(false);
  });

  it("reads public documents without any membership", () => {
    expect(canReadDocument(scope(), doc({ visibility: "public" }))).toBe(true);
  });

  it("requires an approved membership for org documents", () => {
    expect(canReadDocument(scope(), doc({ visibility: "org" }))).toBe(false);
    expect(
      canReadDocument(scope({ memberOrgIds: new Set([ORG_A]) }), doc({ visibility: "org" })),
    ).toBe(true);
  });

  it("grants internal documents to the uploader, documents:edit or an internal role", () => {
    const internal = doc({ visibility: "internal" });
    expect(canReadDocument(scope(), internal)).toBe(false);
    expect(canReadDocument(scope({ userId: "someone-else" }), internal)).toBe(true);
    expect(canReadDocument(scope({ editOrgIds: new Set([ORG_A]) }), internal)).toBe(true);
    expect(
      canReadDocument(
        scope({ roleKeysByOrg: new Map([[ORG_A, new Set(["technician"])]]) }),
        internal,
      ),
    ).toBe(true);
  });

  it("grants private documents only via uploader, documents:edit or a grant", () => {
    const priv = doc({ visibility: "private" });
    expect(canReadDocument(scope(), priv)).toBe(false);
    expect(canReadDocument(scope({ userId: "someone-else" }), priv)).toBe(true);
    expect(canReadDocument(scope({ editOrgIds: new Set([ORG_A]) }), priv)).toBe(true);
    expect(
      canReadDocument(scope({ directGrantDocumentIds: new Set(["doc-1"]) }), priv),
    ).toBe(true);
    expect(
      canReadDocument(
        scope({
          roleIdsByOrg: new Map([[ORG_A, new Set(["role-1"])]]),
          roleGrantDocumentIds: new Map([["doc-1", new Set(["role-1"])]]),
        }),
        priv,
      ),
    ).toBe(true);
  });

  it("does not apply a role grant in an organization where the role is not held", () => {
    const priv = doc({ visibility: "private" });
    expect(
      canReadDocument(
        scope({
          memberOrgIds: new Set([ORG_B]),
          roleIdsByOrg: new Map([[ORG_B, new Set(["role-1"])]]),
          roleGrantDocumentIds: new Map([["doc-1", new Set(["role-1"])]]),
        }),
        priv,
      ),
    ).toBe(false);
  });

  it("lets a super admin read every visibility", () => {
    const superScope = scope({ isSuperAdmin: true });
    for (const visibility of ["private", "internal", "org", "public"]) {
      expect(canReadDocument(superScope, doc({ visibility }))).toBe(true);
    }
  });
});
