import { jest } from "@jest/globals";
import request from "supertest";
import { createMockBuilder, createTestApp } from "./helpers";
import { errorHandler } from "../middleware/error";
import type { OpenApiPathItem } from "../openapi/builder";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    JWT_SECRET: "test-jwt-secret",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn((_req: unknown, _moduleKey: string, _kind: string) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
  getSupabaseUser: jest.fn(() => require("../services/supabase").getSupabaseAdmin()),
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

/**
 * Auth is stubbed (rather than driven through GoTrue) so every contract test
 * reaches its handler without a token round-trip; the stub still populates the
 * `authUser`/`userJwt` fields the handlers read. The suite under test is the
 * response shape, not the auth middleware (covered by middleware-*.test.ts).
 */
jest.mock("../middleware/auth", () => ({
  requireAuth: (
    req: { authUser?: unknown; userJwt?: string; headers: { authorization?: string } },
    _res: unknown,
    next: () => void,
  ) => {
    req.authUser = { userId: "user-1", email: "test@example.com" };
    req.userJwt = req.headers.authorization?.slice(7) ?? "header.eyJhYWwiOiJhYWwxIn0.sig";
    next();
  },
}));

jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireOrgAccessByParam: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../middleware/permissions", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../middleware/admin", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Shared in-memory bucket across the suite would 429 after a handful of calls;
// limiter behaviour has its own suite (middleware-rate-limit.test.ts).
jest.mock("../middleware/rate-limit", () => ({
  rateLimitAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  rateLimitEmail: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { getSupabaseAdmin, getSupabaseUser } from "../services/supabase";
import { clearMfaFactorCache } from "../lib/mfa";
import { buildSpec } from "../openapi/spec";
import authRouter from "../routes/auth";
import ticketsRouter from "../routes/tickets";
import storeRouter from "../routes/store";

const app = createTestApp();
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/tickets", ticketsRouter);
app.use("/api/v1/store", storeRouter);
app.use(errorHandler);

// --- minimal JSON-schema validator -----------------------------------------
//
// Deliberately dependency-free: it understands just the keywords spec.ts uses
// (`type`, `required`, `properties`, `items`, `nullable`, `enum`) and keeps
// walking nested objects/arrays, reporting the path of the first mismatch.

interface JsonSchema {
  type?: string;
  nullable?: boolean;
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  enum?: unknown[];
  additionalProperties?: boolean | JsonSchema;
}

function assertMatchesSchema(value: unknown, schema: JsonSchema, path = "$"): void {
  if (value === null || value === undefined) {
    if (schema.nullable) return;
    throw new Error(`${path}: expected ${schema.type ?? "a value"}, got ${String(value)}`);
  }
  if (schema.enum && !schema.enum.includes(value)) {
    throw new Error(
      `${path}: ${JSON.stringify(value)} is not one of ${JSON.stringify(schema.enum)}`,
    );
  }
  switch (schema.type) {
    case undefined:
      return;
    case "object": {
      if (typeof value !== "object" || Array.isArray(value)) {
        throw new Error(
          `${path}: expected object, got ${Array.isArray(value) ? "array" : typeof value}`,
        );
      }
      const record = value as Record<string, unknown>;
      for (const key of schema.required ?? []) {
        if (!(key in record)) throw new Error(`${path}: missing required property "${key}"`);
      }
      for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
        if (key in record) assertMatchesSchema(record[key], propertySchema, `${path}.${key}`);
      }
      if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        for (const [key, propertyValue] of Object.entries(record)) {
          if (!(schema.properties && key in schema.properties)) {
            assertMatchesSchema(propertyValue, schema.additionalProperties, `${path}.${key}`);
          }
        }
      }
      return;
    }
    case "array": {
      if (!Array.isArray(value)) throw new Error(`${path}: expected array, got ${typeof value}`);
      if (schema.items) {
        value.forEach((item, index) =>
          assertMatchesSchema(item, schema.items as JsonSchema, `${path}[${index}]`),
        );
      }
      return;
    }
    case "string":
      if (typeof value !== "string")
        throw new Error(`${path}: expected string, got ${typeof value}`);
      return;
    case "number":
      if (typeof value !== "number" || Number.isNaN(value))
        throw new Error(`${path}: expected number, got ${typeof value}`);
      return;
    case "boolean":
      if (typeof value !== "boolean")
        throw new Error(`${path}: expected boolean, got ${typeof value}`);
      return;
    default:
      throw new Error(`${path}: unsupported schema type "${schema.type}"`);
  }
}

// --- schema lookup: resolved from the spec, never duplicated -----------------
//
// The tests import `buildSpec()` and pull the declared success schema straight
// from `paths[...][method].responses[<2xx>].content["application/json"].schema`.
// If a route loses or changes its schema, the contract test fails rather than
// silently validating a stale copy.

const spec = buildSpec();

function successSchema(
  path: string,
  method: keyof OpenApiPathItem,
): { status: number; schema: JsonSchema } {
  const operation = spec.paths[path]?.[method];
  if (!operation) throw new Error(`spec has no ${method.toUpperCase()} ${path}`);
  for (const [status, response] of Object.entries(operation.responses)) {
    const schema = response.content?.["application/json"]?.schema;
    if (/^2\d\d$/.test(status) && schema) {
      return { status: Number(status), schema: schema as JsonSchema };
    }
  }
  throw new Error(`spec has no JSON success schema for ${method.toUpperCase()} ${path}`);
}

function expectResponseMatchesSpec(
  res: { status: number; body: unknown },
  path: string,
  method: keyof OpenApiPathItem,
): void {
  const { status, schema } = successSchema(path, method);
  expect(res.status).toBe(status);
  assertMatchesSchema(res.body, schema);
}

// --- fixtures ---------------------------------------------------------------

const jwt = (aal: "aal1" | "aal2") =>
  `x.${Buffer.from(JSON.stringify({ aal })).toString("base64url")}.y`;
const AAL2 = jwt("aal2");
const AAL1 = jwt("aal1");

type MockFactor = { id: string; factor_type: string; status: string };
const verifiedFactor: MockFactor = { id: "f1", factor_type: "totp", status: "verified" };

const PROFILE_ROW = {
  id: "user-1",
  full_name: "Test User",
  email: "test@example.com",
  phone: null,
  title: null,
  is_super_admin: false,
  default_organization_id: null,
  created_at: "2026-01-01T00:00:00.000Z",
};

const TICKET_ROW = {
  id: "00000000-0000-0000-0000-000000000010",
  organization_id: "00000000-0000-0000-0000-000000000001",
  title: "Test Ticket",
  description: null,
  status: "new",
  priority: "normal",
  category: null,
  source: "portal",
  assigned_to: null,
  external_jsm_issue_key: null,
  jira_last_synced_at: null,
  labels: null,
  resolution: null,
  metadata: {},
  version: 1,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  created_by: "user-1",
};

const STORE_QUOTE_ROW = {
  id: "quote-1",
  name: "Jane Buyer",
  email: "jane@example.com",
  phone: "207-555-0100",
  notes: "We need help",
  items: [{ productId: "password-security-checkup", name: "Password Security Checkup" }],
  organization_id: null,
  status: "new",
  created_at: "2026-09-27T00:00:00.000Z",
  updated_at: null,
};

// --- supabase mock ----------------------------------------------------------

type RecoveryRow = {
  id: string;
  user_id: string;
  code_hash: string;
  salt: string;
  used_at: string | null;
  created_at: string;
};

type RecoveryColumn = keyof RecoveryRow;
type Filter = { column: RecoveryColumn; value: string | null; kind: "eq" | "is" | "neq" };
type InsertRow = { user_id: string; code_hash: string; salt: string };
type QueryResult = { data: unknown; error: null };

/**
 * In-memory stand-in for `mfa_recovery_codes` (ported from mfa-recovery.test.ts)
 * so the recovery-code flow can be driven end-to-end with the real scrypt
 * hashing: a generated code verifies, is marked used, and prunes its siblings.
 */
function createRecoveryBuilder(store: RecoveryRow[]) {
  let op: "select" | "insert" | "update" | "delete" = "select";
  let insertRows: InsertRow[] = [];
  let updateValues: { used_at: string } | null = null;
  const filters: Filter[] = [];

  const matches = (row: RecoveryRow): boolean =>
    filters.every((filter) => {
      const value = row[filter.column];
      return filter.kind === "neq" ? value !== filter.value : value === filter.value;
    });

  const execute = (): QueryResult => {
    if (op === "insert") {
      const createdAt = new Date().toISOString();
      for (const row of insertRows) {
        store.push({ id: `rc-${store.length + 1}`, used_at: null, created_at: createdAt, ...row });
      }
      return { data: null, error: null };
    }
    if (op === "update") {
      for (const row of store) {
        if (matches(row) && updateValues) Object.assign(row, updateValues);
      }
      return { data: null, error: null };
    }
    if (op === "delete") {
      for (let i = store.length - 1; i >= 0; i--) {
        if (matches(store[i])) store.splice(i, 1);
      }
      return { data: null, error: null };
    }
    return { data: store.filter(matches), error: null };
  };

  const builder = {
    select: jest.fn((_columns: string) => builder),
    insert: jest.fn((rows: InsertRow[]) => {
      op = "insert";
      insertRows = rows;
      return builder;
    }),
    update: jest.fn((values: { used_at: string }) => {
      op = "update";
      updateValues = values;
      return builder;
    }),
    delete: jest.fn(() => {
      op = "delete";
      return builder;
    }),
    eq: jest.fn((column: RecoveryColumn, value: string) => {
      filters.push({ column, value, kind: "eq" });
      return builder;
    }),
    is: jest.fn((column: RecoveryColumn, value: string | null) => {
      filters.push({ column, value, kind: "is" });
      return builder;
    }),
    neq: jest.fn((column: RecoveryColumn, value: string) => {
      filters.push({ column, value, kind: "neq" });
      return builder;
    }),
    then(onfulfilled?: (value: QueryResult) => unknown, onrejected?: (reason: unknown) => unknown) {
      return Promise.resolve(execute()).then(onfulfilled, onrejected);
    },
  };

  return builder;
}

function mockSupabase(options: { factors?: MockFactor[] } = {}) {
  const recoveryRows: RecoveryRow[] = [];
  const listFactors = jest
    .fn()
    .mockResolvedValue({ data: { factors: options.factors ?? [] }, error: null });
  const deleteFactor = jest.fn().mockResolvedValue({ data: {}, error: null });

  const mock = {
    from: jest.fn((table: string) => {
      if (table === "mfa_recovery_codes") return createRecoveryBuilder(recoveryRows);
      if (table === "profiles") return createMockBuilder({ data: PROFILE_ROW, error: null });
      return createMockBuilder({ data: null, error: null });
    }),
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: {
          session: { access_token: "token-123" },
          user: { id: "user-1", email: "test@example.com" },
        },
        error: null,
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
      admin: { mfa: { listFactors, deleteFactor } },
      mfa: {
        listFactors: jest.fn().mockResolvedValue({
          data: {
            all: [{ id: "f1", factor_type: "totp", friendly_name: "Phone", status: "verified" }],
            totp: [
              {
                id: "f1",
                friendly_name: "Phone",
                status: "verified",
                created_at: "2026-01-01T00:00:00.000Z",
              },
            ],
          },
          error: null,
        }),
        enroll: jest.fn().mockResolvedValue({
          data: {
            id: "f1",
            type: "totp",
            friendly_name: "Phone",
            totp: { qr_code: "<svg/>", secret: "ABC123", uri: "otpauth://totp/mct" },
          },
          error: null,
        }),
        challenge: jest
          .fn()
          .mockResolvedValue({ data: { id: "c1", expires_at: 1767225600 }, error: null }),
        verify: jest.fn().mockResolvedValue({ data: { access_token: "aal2-token" }, error: null }),
        unenroll: jest.fn().mockResolvedValue({ data: { id: "f1" }, error: null }),
      },
    },
  };

  (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);
  (getSupabaseUser as jest.Mock).mockReturnValue(mock);
  return { mock, recoveryRows, listFactors, deleteFactor };
}

async function generateRecoveryCodesViaApi(): Promise<string[]> {
  const res = await request(app)
    .post("/api/v1/auth/mfa/recovery-codes")
    .set("Authorization", `Bearer ${AAL2}`);
  expect(res.status).toBe(201);
  return res.body.data.codes as string[];
}

describe("OpenAPI contract — success response schemas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearMfaFactorCache();
  });

  describe("validator", () => {
    const fixtureSchema: JsonSchema = {
      type: "object",
      required: ["success", "data"],
      properties: {
        success: { type: "boolean" },
        data: {
          type: "object",
          required: ["id", "tags"],
          properties: {
            id: { type: "string" },
            status: { type: "string", enum: ["new", "done"] },
            note: { type: "string", nullable: true },
            tags: { type: "array", items: { type: "string" } },
          },
        },
      },
    };

    it("accepts a matching value (including nullable + nested arrays)", () => {
      expect(() =>
        assertMatchesSchema(
          { success: true, data: { id: "x", status: "new", note: null, tags: ["a", "b"] } },
          fixtureSchema,
        ),
      ).not.toThrow();
    });

    it("throws when a required property is missing", () => {
      expect(() =>
        assertMatchesSchema({ success: true, data: { id: "x" } }, fixtureSchema),
      ).toThrow(/missing required property "tags"/);
    });

    it("throws on a type mismatch inside a nested array", () => {
      expect(() =>
        assertMatchesSchema({ success: true, data: { id: "x", tags: [1] } }, fixtureSchema),
      ).toThrow(/\$\.data\.tags\[0\]: expected string/);
    });

    it("throws on an enum mismatch", () => {
      expect(() =>
        assertMatchesSchema(
          { success: true, data: { id: "x", tags: [], status: "unknown" } },
          fixtureSchema,
        ),
      ).toThrow(/is not one of/);
    });

    it("throws when a non-nullable value is null", () => {
      expect(() =>
        assertMatchesSchema({ success: true, data: { id: null, tags: [] } }, fixtureSchema),
      ).toThrow(/\$\.data\.id: expected string, got null/);
    });
  });

  describe("auth routes", () => {
    it("POST /auth/sign-in", async () => {
      mockSupabase();
      const res = await request(app)
        .post("/api/v1/auth/sign-in")
        .send({ email: "a@b.com", password: "secret" });
      expectResponseMatchesSpec(res, "/auth/sign-in", "post");
    });

    it("POST /auth/sign-up", async () => {
      mockSupabase();
      const res = await request(app)
        .post("/api/v1/auth/sign-up")
        .send({ email: "new@b.com", password: "SecurePass123!", fullName: "New User" });
      expectResponseMatchesSpec(res, "/auth/sign-up", "post");
    });

    it("GET /auth/me", async () => {
      mockSupabase();
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer token-123");
      expectResponseMatchesSpec(res, "/auth/me", "get");
    });

    it("GET /auth/mfa/factors", async () => {
      mockSupabase();
      const res = await request(app)
        .get("/api/v1/auth/mfa/factors")
        .set("Authorization", "Bearer token-123");
      expectResponseMatchesSpec(res, "/auth/mfa/factors", "get");
    });

    it("POST /auth/mfa/enroll", async () => {
      mockSupabase();
      const res = await request(app)
        .post("/api/v1/auth/mfa/enroll")
        .set("Authorization", "Bearer token-123")
        .send({ friendlyName: "Phone" });
      expectResponseMatchesSpec(res, "/auth/mfa/enroll", "post");
    });

    it("POST /auth/mfa/challenge", async () => {
      mockSupabase();
      const res = await request(app)
        .post("/api/v1/auth/mfa/challenge")
        .set("Authorization", "Bearer token-123")
        .send({ factorId: "f1" });
      expectResponseMatchesSpec(res, "/auth/mfa/challenge", "post");
    });

    it("POST /auth/mfa/verify", async () => {
      mockSupabase();
      const res = await request(app)
        .post("/api/v1/auth/mfa/verify")
        .set("Authorization", "Bearer token-123")
        .send({ factorId: "f1", challengeId: "c1", code: "123456" });
      expectResponseMatchesSpec(res, "/auth/mfa/verify", "post");
    });
  });

  describe("MFA recovery routes", () => {
    it("POST /auth/mfa/recovery-codes", async () => {
      mockSupabase({ factors: [verifiedFactor] });
      const res = await request(app)
        .post("/api/v1/auth/mfa/recovery-codes")
        .set("Authorization", `Bearer ${AAL2}`);
      expectResponseMatchesSpec(res, "/auth/mfa/recovery-codes", "post");
    });

    it("GET /auth/mfa/recovery-codes", async () => {
      mockSupabase({ factors: [verifiedFactor] });
      await generateRecoveryCodesViaApi();
      const res = await request(app)
        .get("/api/v1/auth/mfa/recovery-codes")
        .set("Authorization", `Bearer ${AAL1}`);
      expectResponseMatchesSpec(res, "/auth/mfa/recovery-codes", "get");
    });

    it("DELETE /auth/mfa/recovery-codes", async () => {
      mockSupabase({ factors: [verifiedFactor] });
      await generateRecoveryCodesViaApi();
      const res = await request(app)
        .delete("/api/v1/auth/mfa/recovery-codes")
        .set("Authorization", `Bearer ${AAL2}`);
      expectResponseMatchesSpec(res, "/auth/mfa/recovery-codes", "delete");
    });

    it("POST /auth/mfa/recovery", async () => {
      mockSupabase({ factors: [verifiedFactor] });
      const codes = await generateRecoveryCodesViaApi();
      const res = await request(app)
        .post("/api/v1/auth/mfa/recovery")
        .set("Authorization", `Bearer ${AAL1}`)
        .send({ code: codes[0] });
      expectResponseMatchesSpec(res, "/auth/mfa/recovery", "post");
    });
  });

  describe("tickets routes", () => {
    it("GET /tickets list envelope", async () => {
      const { mock } = mockSupabase();
      mock.from.mockReturnValueOnce(
        createMockBuilder({ data: [TICKET_ROW], error: null, count: 1 }),
      );
      const res = await request(app)
        .get("/api/v1/tickets")
        .set("Authorization", "Bearer token-123");
      expectResponseMatchesSpec(res, "/tickets", "get");
    });

    it("GET /tickets/{id} row with embedded comments", async () => {
      const { mock } = mockSupabase();
      mock.from.mockReturnValueOnce(
        createMockBuilder({
          data: {
            ...TICKET_ROW,
            ticket_comments: [
              {
                id: "comment-1",
                ticket_id: TICKET_ROW.id,
                organization_id: TICKET_ROW.organization_id,
                author_id: "user-1",
                body: "Test comment",
                is_internal: false,
                created_at: "2026-01-02T00:00:00.000Z",
                edited_at: null,
              },
            ],
          },
          error: null,
        }),
      );
      const res = await request(app)
        .get(`/api/v1/tickets/${TICKET_ROW.id}`)
        .set("Authorization", "Bearer token-123");
      expectResponseMatchesSpec(res, "/tickets/{id}", "get");
    });
  });

  describe("store routes", () => {
    it("POST /store/quotes returns the inserted row", async () => {
      const { mock } = mockSupabase();
      mock.from.mockImplementation((table: string) => {
        if (table === "store_quotes") {
          return createMockBuilder({ data: STORE_QUOTE_ROW, error: null });
        }
        if (table === "store_quote_requests") {
          return createMockBuilder({ data: { id: "qr-1" }, error: null });
        }
        if (table === "store_leads") {
          return createMockBuilder({ data: { id: "lead-1" }, error: null });
        }
        return createMockBuilder({ data: null, error: null });
      });
      const res = await request(app)
        .post("/api/v1/store/quotes")
        .send({
          name: "Jane Buyer",
          email: "jane@example.com",
          notes: "We need help",
          items: [{ productId: "password-security-checkup", name: "Password Security Checkup" }],
        });
      expectResponseMatchesSpec(res, "/store/quotes", "post");
    });
  });

  it("every contract-tested route declares a JSON success schema", () => {
    const tested: Array<[string, keyof OpenApiPathItem]> = [
      ["/auth/sign-in", "post"],
      ["/auth/sign-up", "post"],
      ["/auth/me", "get"],
      ["/auth/mfa/factors", "get"],
      ["/auth/mfa/enroll", "post"],
      ["/auth/mfa/challenge", "post"],
      ["/auth/mfa/verify", "post"],
      ["/auth/mfa/recovery-codes", "post"],
      ["/auth/mfa/recovery-codes", "get"],
      ["/auth/mfa/recovery-codes", "delete"],
      ["/auth/mfa/recovery", "post"],
      ["/tickets", "get"],
      ["/tickets/{id}", "get"],
      ["/store/quotes", "post"],
    ];
    for (const [path, method] of tested) {
      expect(() => successSchema(path, method)).not.toThrow();
    }
  });
});
