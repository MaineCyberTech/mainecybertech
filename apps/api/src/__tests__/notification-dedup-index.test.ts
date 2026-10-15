import { describe, expect, it } from "@jest/globals";
import fs from "fs";
import path from "path";

/**
 * 42P10 regression guard (migration 5302463).
 *
 * The in-app notification dedup path upserts with
 * `onConflict: "notification_key"` in both the API (`src/lib/notify.ts`) and
 * the worker (`apps/worker/src/notification-store.ts`). PostgreSQL cannot
 * infer a PARTIAL unique index as an ON CONFLICT target, so the migration
 * chain must end with a full unique index on `notification_key` and the call
 * sites must keep targeting that column. 5302107 created the index WITH a
 * `where notification_key is not null` predicate, which made every deduped
 * insert fail on the deployed environment; 5302463 replaces it.
 */

const MIGRATIONS = path.join(__dirname, "..", "..", "..", "..", "supabase", "migrations");
const CALL_SITES = [
  path.join(__dirname, "..", "lib", "notify.ts"),
  path.join(__dirname, "..", "..", "..", "worker", "src", "notification-store.ts"),
];

interface IndexStatement {
  file: string;
  statement: string;
}

function notificationKeyIndexes(): IndexStatement[] {
  const statements: IndexStatement[] = [];
  const files = fs
    .readdirSync(MIGRATIONS)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS, file), "utf8");
    // Strip line comments so a commented-out statement cannot count.
    const withoutComments = sql.replace(/--[^\n]*/g, "");
    const pattern = /create\s+(?:unique\s+)?index[^;]*idx_notifications_key[^;]*;/gi;
    for (const match of withoutComments.matchAll(pattern)) {
      statements.push({
        file,
        statement: match[0].replace(/\s+/g, " ").trim().toLowerCase(),
      });
    }
  }

  return statements;
}

describe("notifications dedup index (ON CONFLICT notification_key)", () => {
  const indexes = notificationKeyIndexes();

  it("is defined by the migration chain", () => {
    expect(indexes.length).toBeGreaterThan(0);
  });

  it("ends as a non-partial unique index on notification_key", () => {
    const latest = indexes[indexes.length - 1];
    expect(latest.file).toBe("5302463_fix_notification_key_dedup_index.sql");
    expect(latest.statement).toContain("unique index");
    expect(latest.statement).toContain("notification_key");
    expect(latest.statement).not.toMatch(/\bwhere\b/);
  });

  it.each(CALL_SITES)("upserts with the indexed conflict target: %s", (file) => {
    const source = fs.readFileSync(file, "utf8");
    expect(source).toContain('onConflict: "notification_key"');
  });
});
