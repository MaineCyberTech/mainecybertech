import * as fs from "fs";
import * as path from "path";

/**
 * FILE-P2-008 — documents-bucket direct-write guard.
 *
 * The finding: a member with `documents:create` could write objects straight to
 * the private `documents` bucket with a Supabase access token, bypassing the
 * API's upload validation (MIME allow-list, 2MB cap, byte sniffing) because the
 * authenticated INSERT/UPDATE policies on storage.objects allowed it.
 *
 * The fix removes those policies — all object writes now go through the API as
 * service_role — and adds a bucket-level file_size_limit. Storage RLS cannot be
 * exercised in ts-jest without a live Supabase, so this guard replays the
 * migration chain (the source of truth applied by supabase-migrations.yml) and
 * fails if the final state grants an authenticated INSERT/UPDATE/ALL policy on
 * the documents bucket again, or if the bucket size limit disappears.
 *
 * Run against the pre-fix chain this guard reports both policies as offenders;
 * it was validated that way before the hardening migration was added.
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

type StoragePolicy = { name: string; kind: "create" | "drop"; body: string };

/** Final create/drop state of every `storage.objects` policy, in chain order. */
function storagePolicyState(): Map<string, StoragePolicy> {
  const state = new Map<string, StoragePolicy>();
  const createRe =
    /create\s+policy\s+(?:if\s+not\s+exists\s+)?([a-z0-9_"]+)\s+on\s+storage\.objects([\s\S]*?);/gi;
  const dropRe = /drop\s+policy\s+(?:if\s+exists\s+)?([a-z0-9_"]+)\s+on\s+storage\.objects/gi;

  for (const file of migrationFiles()) {
    const sql = maskComments(fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8"));
    const events: { pos: number; policy: StoragePolicy }[] = [];
    for (const match of sql.matchAll(createRe)) {
      events.push({
        pos: match.index ?? 0,
        policy: {
          name: match[1].toLowerCase(),
          kind: "create",
          body: match[2].toLowerCase(),
        },
      });
    }
    for (const match of sql.matchAll(dropRe)) {
      events.push({
        pos: match.index ?? 0,
        policy: { name: match[1].toLowerCase(), kind: "drop", body: "" },
      });
    }
    events.sort((a, b) => a.pos - b.pos);
    for (const { policy } of events) state.set(policy.name, policy);
  }
  return state;
}

describe("documents bucket direct-write guard (FILE-P2-008)", () => {
  const state = storagePolicyState();

  it("has no active authenticated INSERT/UPDATE policy on the documents bucket", () => {
    const offenders: string[] = [];
    for (const [name, policy] of state) {
      if (policy.kind !== "create") continue;
      if (!/bucket_id\s*=\s*'documents'/.test(policy.body)) continue;
      const grantsInsertOrUpdate =
        /\bfor\s+(insert|update|all)\b/.test(policy.body) ||
        !/\bfor\s+(select|delete)\b/.test(policy.body);
      const appliesToAuthenticated =
        /\bto\s+(authenticated|public)\b/.test(policy.body) || !/\bto\s+\w/.test(policy.body);
      if (grantsInsertOrUpdate && appliesToAuthenticated) offenders.push(name);
    }
    expect(offenders).toEqual([]);
  });

  it("sets a bucket-level file_size_limit on the documents bucket", () => {
    const updates: string[] = [];
    for (const file of migrationFiles()) {
      const sql = maskComments(fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8"));
      const updateRe = /update\s+storage\.buckets[\s\S]*?where\s+id\s*=\s*'documents'/gi;
      for (const match of sql.matchAll(updateRe)) updates.push(match[0]);
    }
    expect(updates.length).toBeGreaterThan(0);
    expect(updates[updates.length - 1]).toMatch(/file_size_limit\s*=/i);
  });
});
