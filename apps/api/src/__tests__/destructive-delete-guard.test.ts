import * as fs from "fs";
import * as path from "path";

/**
 * ADMIN-P2-002 — destructive-delete confirmation guard.
 *
 * Every `router.delete` handler must either call `assertDeleteConfirmed`
 * (the `{ confirm: true }` body contract) or `assertOrgDeleteConfirmed`
 * (organization delete: `{ confirm: true, slug: "<slug>" }`), or be listed
 * below with an explicit reason. The organization delete must use the typed
 * variant. A new DELETE route that skips confirmation fails this guard in CI,
 * so the decision to add one is reviewable instead of silent.
 *
 * Exemptions are limited to self-service deletes of data the caller owns,
 * where an extra confirmation round-trip would not protect another party.
 */
const EXEMPT_DELETES: Record<string, string> = {
  "auth.ts /mfa/factors/:factorId":
    "self-service removal of the caller's own MFA factor (AAL2-gated)",
  "auth.ts /mfa/recovery-codes":
    "self-service invalidation of the caller's own recovery codes (AAL2-gated)",
  "notifications.ts /:id": "a user dismissing their own notification",
  "push-subscriptions.ts /": "device self-service unsubscribe (the browser owns the subscription)",
  "documents.ts /:id/shares/:shareId":
    "share revocation reduces access and must stay immediate (no confirmation prompt)",
  "projects.ts /:id/updates/:updateId": "the author deleting their own project update",
  "projects.ts /:id/tasks/:taskId/comments/:commentId":
    "the author deleting their own task comment",
};

const ROUTES_DIR = path.join(__dirname, "..", "routes");
const DELETE_RE = /router\.delete\s*\(\s*([`"'])(.*?)\1/g;

function routeFiles(): string[] {
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return entry.isFile() && entry.name.endsWith(".ts") ? [full] : [];
    });
  return walk(ROUTES_DIR);
}

describe("destructive-delete confirmation guard (ADMIN-P2-002)", () => {
  it("every DELETE handler confirms, or is an explicit self-service exemption", () => {
    const violations: string[] = [];
    const seen = new Set<string>();

    for (const file of routeFiles()) {
      const src = fs.readFileSync(file, "utf8");
      const rel = path.relative(ROUTES_DIR, file).split(path.sep).join("/");
      const matches = [...src.matchAll(DELETE_RE)];

      matches.forEach((match, index) => {
        const routePath = match[2];
        const key = `${rel} ${routePath}`;
        seen.add(key);
        const start = match.index ?? 0;
        const end = index + 1 < matches.length ? (matches[index + 1].index ?? src.length) : src.length;
        const handler = src.slice(start, end);

        const hasConfirm =
          handler.includes("assertDeleteConfirmed(") ||
          handler.includes("assertOrgDeleteConfirmed(");
        if (!hasConfirm && !(key in EXEMPT_DELETES)) {
          violations.push(key);
        }
      });
    }

    const staleExemptions = Object.keys(EXEMPT_DELETES).filter((key) => !seen.has(key));

    if (violations.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        "DELETE handlers without a confirmation gate (add assertDeleteConfirmed/assertOrgDeleteConfirmed or document the exemption):\n" +
          violations.map((v) => "  - " + v).join("\n"),
      );
    }
    if (staleExemptions.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        "Stale confirmation exemptions (route no longer exists — remove the entry):\n" +
          staleExemptions.map((v) => "  - " + v).join("\n"),
      );
    }

    expect(violations).toEqual([]);
    expect(staleExemptions).toEqual([]);
  });

  it("organization delete uses the typed slug confirmation", () => {
    const src = fs.readFileSync(path.join(ROUTES_DIR, "organizations.ts"), "utf8");
    const deleteMatch = /router\.delete\s*\(\s*["']\/:id["']/.exec(src);
    expect(deleteMatch).not.toBeNull();

    const handler = src.slice(deleteMatch!.index);
    expect(handler).toContain("assertOrgDeleteConfirmed(");
    expect(handler).toContain('select("id, name, slug")');
  });
});
