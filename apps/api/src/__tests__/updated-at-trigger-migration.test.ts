import * as fs from "fs";
import * as path from "path";

/**
 * DATA-P2-009 — module `updated_at` trigger migration guard.
 *
 * The finding: 69 module tables declare `updated_at` but no trigger installs
 * it, and the generic crudRoute PATCH factories never wrote the column, so
 * "last modified" was frozen at insert time.
 *
 * The fix is one idempotent migration that installs the existing
 * `public.set_updated_at()` trigger on every public base table with an
 * `updated_at` column and no such trigger yet. ts-jest cannot execute SQL, so
 * this guard pins the properties that make the migration safe to re-run and
 * complete: the loop is function-matched (not name-matched), scoped to
 * `public` base tables, and wrapped in begin;/commit;.
 *
 * The execution-level verification is `tools/migration_chain_check.sh`
 * (applies the whole chain to a fresh Postgres); this test catches an
 * accidental weakening of the migration in review.
 */

const MIGRATIONS_DIR = path.join(__dirname, "..", "..", "..", "..", "supabase", "migrations");

function findMigration(prefix: string): string {
  const file = fs
    .readdirSync(MIGRATIONS_DIR)
    .find((name) => name.startsWith(prefix) && name.endsWith(".sql"));
  if (!file) throw new Error(`migration ${prefix} not found`);
  return fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
}

describe("module updated_at trigger migration (DATA-P2-009)", () => {
  const sql = findMigration("5302443");

  it("is wrapped in an explicit transaction", () => {
    expect(sql).toMatch(/^\s*begin\s*;/im);
    expect(sql).toMatch(/^\s*commit\s*;/im);
  });

  it("installs public.set_updated_at() on public base tables with updated_at", () => {
    expect(sql).toMatch(/information_schema\.columns/);
    expect(sql).toMatch(/column_name\s*=\s*'updated_at'/);
    expect(sql).toMatch(/table_type\s*=\s*'BASE TABLE'/);
    expect(sql).toMatch(/execute\s+function\s+public\.set_updated_at\(\)/);
    expect(sql).toMatch(/execute\s+format\(/);
  });

  it("is idempotent: skips tables that already have a set_updated_at trigger", () => {
    expect(sql).toMatch(/not\s+exists\s*\(/i);
    expect(sql).toMatch(/pg_trigger/);
    // Match by trigger function, not just by name, so a differently-named
    // updated_at trigger is not double-installed.
    expect(sql).toMatch(/tg\.tgfoid\s*=\s*'public\.set_updated_at'::regproc/);
  });

  it("quotes dynamic identifiers instead of interpolating raw names", () => {
    // %I is the identifier-quoting placeholder; %s would allow injection if a
    // table name ever contained quotes.
    expect(sql).toMatch(/%I/);
    expect(sql).not.toMatch(/create trigger %s/);
  });
});
