import * as fs from "fs";
import * as path from "path";

/**
 * SEARCH-P2-005 regression.
 *
 * The admin analytics summary route calls the `get_analytics_summary` RPC
 * (apps/api/src/routes/analytics.ts), but no migration ever defined it, so the
 * endpoint always failed with a PostgREST "function not found" error. This
 * static test pins the contract between the route and the migration that now
 * defines it: the RPC exists, returns the SDK's `{ event, count }` shape, reads
 * the events table, and stays service-role only (the route enforces the admin
 * gate; a direct authenticated call must not bypass it).
 */

const MIGRATIONS_DIR = path.join(__dirname, "..", "..", "..", "..", "supabase", "migrations");

function findMigration(): string {
  const file = fs
    .readdirSync(MIGRATIONS_DIR)
    .find((name) => name.endsWith(".sql") && name.includes("search_analytics_summary"));
  if (!file) throw new Error("get_analytics_summary migration is missing");
  return file;
}

describe("get_analytics_summary RPC (SEARCH-P2-005)", () => {
  it("is defined by exactly one migration", () => {
    const matches = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter(
        (name) =>
          name.endsWith(".sql") &&
          /create\s+or\s+replace\s+function\s+public\.get_analytics_summary/i.test(
            fs.readFileSync(path.join(MIGRATIONS_DIR, name), "utf8"),
          ),
      );
    expect(matches).toHaveLength(1);
  });

  it("returns event/count rows from store_analytics_events and is service-role only", () => {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, findMigration()), "utf8");

    expect(sql).toMatch(/create or replace function public\.get_analytics_summary\(\)/i);
    expect(sql).toMatch(/returns table \(event text, count bigint\)/i);
    expect(sql).toMatch(/from public\.store_analytics_events/i);
    expect(sql).toMatch(
      /revoke all on function public\.get_analytics_summary\(\) from public, anon, authenticated;/i,
    );
    expect(sql).toMatch(
      /grant execute on function public\.get_analytics_summary\(\) to service_role;/i,
    );
  });

  it("matches the RPC name called by the analytics route", () => {
    const route = fs.readFileSync(
      path.join(__dirname, "..", "routes", "analytics.ts"),
      "utf8",
    );
    expect(route).toContain('rpc("get_analytics_summary")');
  });
});
