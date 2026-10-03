import { jest } from "@jest/globals";
import request from "supertest";
import authRouter from "../routes/auth";
import { createTestApp } from "./helpers";
import { errorHandler } from "../middleware/error";

// scrypt hashing/verification is deliberately CPU-bound; give the suite headroom
// so a loaded CI runner does not trip the default 5s per-test timeout.
jest.setTimeout(20_000);

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
  getScopedClient: jest.fn((_req: unknown, _moduleKey: string, _kind: string) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
  getSupabaseUser: jest.fn(),
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

// The route-level limiter shares one in-memory IP bucket across the suite (26+
// requests > 10/window). Limiter behaviour is covered by
// `middleware-rate-limit.test.ts`, so pass through here.
jest.mock("../middleware/rate-limit", () => ({
  rateLimitAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  rateLimitEmail: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { getSupabaseAdmin, getSupabaseUser } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { clearMfaFactorCache } from "../lib/mfa";

const app = createTestApp();
app.use("/api/v1/auth", authRouter);
app.use(errorHandler);

const CODE_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/;
const HEX_HASH_RE = /^[0-9a-f]{64}$/;
const HEX_SALT_RE = /^[0-9a-f]{32}$/;

/** A syntactically valid JWT whose `aal` claim drives `decodeAssuranceLevel`. */
const jwt = (aal: "aal1" | "aal2") =>
  `x.${Buffer.from(JSON.stringify({ aal })).toString("base64url")}.y`;

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

interface RecoveryBuilder {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  is: jest.Mock;
  neq: jest.Mock;
  then: (
    onfulfilled?: (value: QueryResult) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
}

/**
 * In-memory stand-in for the `mfa_recovery_codes` table. Modelling the rows
 * (rather than returning canned results) lets the single-use semantics be
 * exercised for real: a spent code stops matching, pruning removes the rest.
 */
function createRecoveryBuilder(store: RecoveryRow[]): RecoveryBuilder {
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
      // A bulk insert gets one timestamp, like Postgres `now()` per transaction.
      const createdAt = new Date().toISOString();
      for (const row of insertRows) {
        store.push({
          id: `rc-${store.length + 1}`,
          used_at: null,
          created_at: createdAt,
          ...row,
        });
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

  const builder: RecoveryBuilder = {
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
    then(onfulfilled, onrejected) {
      return Promise.resolve(execute()).then(onfulfilled, onrejected);
    },
  };

  return builder;
}

type MockFactor = { id: string; factor_type: string; status: string };

function mockSupabase(options: { factors?: MockFactor[] } = {}) {
  const store: RecoveryRow[] = [];
  const listFactors = jest.fn().mockResolvedValue({
    data: { factors: options.factors ?? [] },
    error: null,
  });
  const deleteFactor = jest.fn().mockResolvedValue({ data: {}, error: null });

  const mock = {
    from: jest.fn((_table: string) => createRecoveryBuilder(store)),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
      admin: {
        mfa: { listFactors, deleteFactor },
      },
    },
  };

  (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);
  (getSupabaseUser as jest.Mock).mockReturnValue(mock);
  return { mock, store, listFactors, deleteFactor };
}

const verifiedFactor: MockFactor = { id: "f1", factor_type: "totp", status: "verified" };

async function generateCodes(token = jwt("aal2")): Promise<string[]> {
  const res = await request(app)
    .post("/api/v1/auth/mfa/recovery-codes")
    .set("Authorization", `Bearer ${token}`);
  expect(res.status).toBe(201);
  return res.body.data.codes as string[];
}

function recover(code: string, token = jwt("aal1")) {
  return request(app)
    .post("/api/v1/auth/mfa/recovery")
    .set("Authorization", `Bearer ${token}`)
    .send({ code });
}

describe("MFA recovery codes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearMfaFactorCache();
  });

  describe("POST /mfa/recovery-codes", () => {
    it("generates 10 codes and stores only scrypt hashes", async () => {
      const { store } = mockSupabase({ factors: [verifiedFactor] });

      const codes = await generateCodes();

      expect(codes).toHaveLength(10);
      for (const code of codes) {
        expect(code).toMatch(CODE_RE);
      }
      expect(store).toHaveLength(10);
      const plaintext = new Set(codes.map((code) => code.replace("-", "")));
      for (const row of store) {
        expect(row.code_hash).toMatch(HEX_HASH_RE);
        expect(row.salt).toMatch(HEX_SALT_RE);
        expect(plaintext.has(row.code_hash)).toBe(false);
      }
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "auth.mfa.recovery_codes.generated" }),
      );
    });

    it("replaces every existing code when regenerating", async () => {
      const { store } = mockSupabase({ factors: [verifiedFactor] });
      await generateCodes();
      const firstHashes = store.map((row) => row.code_hash);

      await generateCodes();

      expect(store).toHaveLength(10);
      for (const row of store) {
        expect(firstHashes).not.toContain(row.code_hash);
      }
    });

    it("returns 403 for an aal1 session when a factor exists", async () => {
      const { store, listFactors } = mockSupabase({ factors: [verifiedFactor] });

      const res = await request(app)
        .post("/api/v1/auth/mfa/recovery-codes")
        .set("Authorization", `Bearer ${jwt("aal1")}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("MFA_REQUIRED");
      expect(store).toHaveLength(0);
      expect(listFactors).toHaveBeenCalled();
    });

    it("returns 400 when no verified factor exists", async () => {
      mockSupabase({ factors: [] });

      const res = await request(app)
        .post("/api/v1/auth/mfa/recovery-codes")
        .set("Authorization", `Bearer ${jwt("aal2")}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION");
    });

    it("returns 401 without auth", async () => {
      mockSupabase({ factors: [verifiedFactor] });

      const res = await request(app).post("/api/v1/auth/mfa/recovery-codes");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /mfa/recovery-codes", () => {
    it("reports the unused count and last generation time without requiring aal2", async () => {
      const { store } = mockSupabase({ factors: [verifiedFactor] });
      await generateCodes();

      const res = await request(app)
        .get("/api/v1/auth/mfa/recovery-codes")
        .set("Authorization", `Bearer ${jwt("aal1")}`);

      expect(res.status).toBe(200);
      expect(res.body.data.remaining).toBe(10);
      expect(res.body.data.total).toBe(10);
      expect(res.body.data.lastGeneratedAt).toBe(store[0].created_at);
    });

    it("returns zero and null when no codes exist", async () => {
      mockSupabase({ factors: [verifiedFactor] });

      const res = await request(app)
        .get("/api/v1/auth/mfa/recovery-codes")
        .set("Authorization", `Bearer ${jwt("aal1")}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ remaining: 0, total: 10, lastGeneratedAt: null });
    });
  });

  describe("DELETE /mfa/recovery-codes", () => {
    it("deletes all codes for the user", async () => {
      const { store } = mockSupabase({ factors: [verifiedFactor] });
      await generateCodes();

      const res = await request(app)
        .delete("/api/v1/auth/mfa/recovery-codes")
        .set("Authorization", `Bearer ${jwt("aal2")}`);

      expect(res.status).toBe(200);
      expect(res.body.data.ok).toBe(true);
      expect(store).toHaveLength(0);
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "auth.mfa.recovery_codes.revoked" }),
      );
    });

    it("returns 403 for an aal1 session when a factor exists", async () => {
      const { store } = mockSupabase({ factors: [verifiedFactor] });
      await generateCodes();

      const res = await request(app)
        .delete("/api/v1/auth/mfa/recovery-codes")
        .set("Authorization", `Bearer ${jwt("aal1")}`);

      expect(res.status).toBe(403);
      expect(store).toHaveLength(10);
    });
  });

  describe("POST /mfa/recovery", () => {
    it("spends the code, unenrolls verified totp factors and prunes the rest", async () => {
      const factors: MockFactor[] = [
        { id: "f1", factor_type: "totp", status: "verified" },
        { id: "f2", factor_type: "totp", status: "verified" },
        { id: "f3", factor_type: "totp", status: "unverified" },
        { id: "f4", factor_type: "webauthn", status: "verified" },
      ];
      const { store, deleteFactor } = mockSupabase({ factors });
      const codes = await generateCodes();

      const res = await recover(codes[0]);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ ok: true, factorsRemoved: 2 });
      expect(deleteFactor).toHaveBeenCalledTimes(2);
      expect(deleteFactor).toHaveBeenCalledWith({ id: "f1", userId: "user-1" });
      expect(deleteFactor).toHaveBeenCalledWith({ id: "f2", userId: "user-1" });

      // Exactly the spent row remains, marked used; the other nine are gone.
      expect(store).toHaveLength(1);
      expect(store[0].used_at).not.toBeNull();
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "auth.mfa.recovery.used",
          metadata: { factorsRemoved: 2 },
        }),
      );

      const status = await request(app)
        .get("/api/v1/auth/mfa/recovery-codes")
        .set("Authorization", `Bearer ${jwt("aal1")}`);
      expect(status.body.data.remaining).toBe(0);
    });

    it("accepts a normalized (lowercase, spaced) code", async () => {
      const { deleteFactor } = mockSupabase({ factors: [verifiedFactor] });
      const codes = await generateCodes();

      const res = await recover(` ${codes[0].toLowerCase()} `);

      expect(res.status).toBe(200);
      expect(deleteFactor).toHaveBeenCalledTimes(1);
    });

    it("rejects a wrong code without unenrolling factors", async () => {
      const { store, deleteFactor } = mockSupabase({ factors: [verifiedFactor] });
      await generateCodes();

      const res = await recover("WRONG-CODE");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_RECOVERY_CODE");
      expect(deleteFactor).not.toHaveBeenCalled();
      expect(store.every((row) => row.used_at === null)).toBe(true);
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "auth.mfa.recovery.failed" }),
      );
    });

    it("does not allow a spent code to be reused", async () => {
      const { store, deleteFactor } = mockSupabase({ factors: [verifiedFactor] });
      const codes = await generateCodes();

      const first = await recover(codes[0]);
      expect(first.status).toBe(200);

      const second = await recover(codes[0]);

      expect(second.status).toBe(401);
      expect(second.body.error.code).toBe("INVALID_RECOVERY_CODE");
      expect(deleteFactor).toHaveBeenCalledTimes(1);
      expect(store).toHaveLength(1);
      expect(store[0].used_at).not.toBeNull();
    });

    it("returns 400 when no factor is enrolled", async () => {
      mockSupabase({ factors: [] });

      const res = await recover("ABCDE-FGHJK");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION");
    });

    it("returns 400 for a malformed code", async () => {
      mockSupabase({ factors: [verifiedFactor] });

      const res = await recover("123");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION");
    });

    it("returns 401 without auth", async () => {
      mockSupabase({ factors: [verifiedFactor] });

      const res = await request(app).post("/api/v1/auth/mfa/recovery").send({ code: "ABCDEFGH" });

      expect(res.status).toBe(401);
    });
  });
});
