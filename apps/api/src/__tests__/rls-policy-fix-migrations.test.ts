import * as fs from "fs";
import * as path from "path";

/**
 * RLS-P2-005 / RLS-P2-006 — live-policy migration guards.
 *
 * ts-jest cannot execute SQL, so this guard replays the migration chain (the
 * source of truth applied by supabase-migrations.yml) and asserts the final
 * policy state:
 *
 *  - RLS-P2-005: `document_versions.dv_update` must no longer be the raw,
 *    status-unfiltered membership predicate from 5302081. The final policy has
 *    to route through `public.is_org_member(...)` (approved-aware) and still
 *    gate updates on `documents:edit`.
 *  - RLS-P2-006: the legacy blanket `"Anyone can insert quotes"` policy must be
 *    dropped and every anon/authenticated INSERT on `store_quotes` must
 *    constrain `organization_id` (global null-org, or an org the caller is an
 *    approved member of) so a quote cannot be injected into another tenant.
 *
 * The execution-level verification is `tools/migration_chain_check.sh`
 * (applies the whole chain to a fresh Postgres); this test catches an
 * accidental weakening in review.
 */

const MIGRATIONS_DIR = path.join(__dirname, "..", "..", "..", "..", "supabase", "migrations");

/** Comments are masked (offset-preserving) so commented-out DDL never counts. */
function maskComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, (match) => " ".repeat(match.length))
    .replace(/--[^\n]*/g, (match) => " ".repeat(match.length));
}

function migrationFiles(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => {
      const pa = Number.parseInt(a.match(/^(\d+)/)?.[1] ?? "0", 10);
      const pb = Number.parseInt(b.match(/^(\d+)/)?.[1] ?? "0", 10);
      return pa - pb || a.localeCompare(b);
    });
}

type Policy = { kind: "create" | "drop"; body: string; file: string };

/** Final create/drop state of every policy on `table`, in chain order. */
function policyState(table: "document_versions" | "store_quotes"): Map<string, Policy> {
  const state = new Map<string, Policy>();
  const name = String.raw`(?:"([^"]+)"|'([^']+)'|([A-Za-z_][A-Za-z0-9_$]*))`;
  const createRe = new RegExp(
    String.raw`create\s+policy\s+(?:if\s+not\s+exists\s+)?${name}\s+on\s+(?:public\.)?${table}\b([\s\S]*?);`,
    "gi",
  );
  const dropRe = new RegExp(
    String.raw`drop\s+policy\s+(?:if\s+exists\s+)?${name}\s+on\s+(?:public\.)?${table}\b`,
    "gi",
  );

  for (const file of migrationFiles()) {
    const sql = maskComments(fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8"));
    const events: { pos: number; policyName: string; policy: Policy }[] = [];
    for (const m of sql.matchAll(createRe)) {
      const policyName = (m[1] ?? m[2] ?? m[3]).toLowerCase();
      events.push({
        pos: m.index ?? 0,
        policyName,
        policy: { kind: "create", body: m[4].toLowerCase(), file },
      });
    }
    for (const m of sql.matchAll(dropRe)) {
      const policyName = (m[1] ?? m[2] ?? m[3]).toLowerCase();
      events.push({ pos: m.index ?? 0, policyName, policy: { kind: "drop", body: "", file } });
    }
    events.sort((a, b) => a.pos - b.pos);
    for (const { policyName, policy } of events) state.set(policyName, policy);
  }
  return state;
}

describe("RLS-P2-005 — document_versions.dv_update uses approved membership", () => {
  const dvUpdate = policyState("document_versions").get("dv_update");
  const body = dvUpdate?.body ?? "";

  it("has a live dv_update policy", () => {
    expect(dvUpdate?.kind).toBe("create");
  });

  it("uses the approved-aware helper instead of a raw memberships subquery", () => {
    expect(body).toMatch(/public\.is_org_member\s*\(\s*d\.organization_id\s*\)/);
    expect(body).not.toMatch(/memberships/);
    expect(body).not.toMatch(/auth\.uid\s*\(/);
  });

  it("still gates updates on documents:edit and keeps using/with check", () => {
    expect(body).toMatch(
      /public\.user_has_permission\s*\(\s*d\.organization_id\s*,\s*'documents'\s*,\s*'edit'\s*\)/,
    );
    expect(body).toMatch(/for\s+update/);
    expect(body).toMatch(/with\s+check/);
  });
});

describe("RLS-P2-006 — store_quotes INSERT policies are tenant-scoped", () => {
  const state = policyState("store_quotes");

  it("drops the legacy unfiltered public insert policy", () => {
    expect(state.get("anyone can insert quotes")?.kind).toBe("drop");
  });

  it("keeps service-role full access for admin management", () => {
    const serviceRole = state.get("service_role_all_quotes");
    expect(serviceRole?.kind).toBe("create");
    expect(serviceRole?.body).toMatch(/to\s+service_role/);
  });

  it("every anon/authenticated insert constrains organization_id", () => {
    const offenders: string[] = [];
    for (const [policyName, policy] of state) {
      if (policy.kind !== "create") continue;
      const grantsInsert = /\bfor\s+(insert|all)\b/.test(policy.body);
      if (!grantsInsert) continue;
      const appliesToTenantRoles =
        /\bto\s+(anon|authenticated|public)\b/.test(policy.body) || !/\bto\s+\w/.test(policy.body);
      if (!appliesToTenantRoles) continue;
      const constrained =
        /organization_id\s+is\s+null/.test(policy.body) ||
        /is_org_member\s*\(\s*organization_id\s*\)/.test(policy.body);
      if (!constrained) offenders.push(policyName);
    }
    expect(offenders).toEqual([]);
  });

  it("lets anonymous submitters create only global (null-org) quotes", () => {
    const anon = state.get("anon_insert_quotes");
    expect(anon?.kind).toBe("create");
    expect(anon?.body).toMatch(/to\s+anon/);
    expect(anon?.body).toMatch(/organization_id\s+is\s+null/);
  });

  it("lets authenticated users tag only an org they are approved members of", () => {
    const member = state.get("store_quotes_member_insert");
    expect(member?.kind).toBe("create");
    expect(member?.body).toMatch(/to\s+authenticated/);
    expect(member?.body).toMatch(
      /organization_id\s+is\s+null\s+or\s+public\.is_org_member\s*\(\s*organization_id\s*\)/,
    );
  });
});

describe("RLS fix migrations are transactional", () => {
  for (const prefix of ["5302447", "5302448"]) {
    it(`${prefix} is wrapped in begin;/commit;`, () => {
      const file = migrationFiles().find((f) => f.startsWith(prefix));
      expect(file).toBeDefined();
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file!), "utf8");
      expect(sql).toMatch(/^\s*begin\s*;/im);
      expect(sql).toMatch(/^\s*commit\s*;/im);
    });
  }
});
