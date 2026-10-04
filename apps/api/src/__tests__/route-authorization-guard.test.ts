import * as fs from "fs";
import * as path from "path";

/**
 * TEST-P2-002 — route-mount authorization guard.
 *
 * Route-level suites stub `org-access`/`permissions` with pass-through
 * `next()` handlers, so they prove handler logic but NOT that the router
 * actually mounts the tenant gate. A mutating route added to a tenant-scoped
 * router without `requireAuth`/`requireOrgAccess` would therefore pass its own
 * suite. This static guard reads the route sources and fails when a router that
 * exposes a mutating verb (`post`/`put`/`patch`/`delete`) is missing the
 * expected mount.
 *
 * Exceptions are explicit and documented below; adding a new public or global
 * router requires updating the allowlist, which makes the decision reviewable.
 */

const ROUTES_DIR = path.join(__dirname, "..", "routes");

/** Routers that intentionally accept writes without a user session. */
const PUBLIC_MUTATING = new Set([
  // Public, signature/token-authenticated inbound endpoints.
  "public",
  "webhooks",
]);

/** Session-authenticated routers that are deliberately not tenant-scoped. */
const GLOBAL_MUTATING = new Set([
  // Cross-tenant MSP admin surface (gated by requireAdmin), by design.
  "admin",
  "analytics",
  "roles",
  // Authentication/session endpoints: a tenant is not resolved yet.
  "auth",
]);

const MUTATING_RE = /router\.(post|put|patch|delete)\s*\(/;

describe("route-mount authorization guard (TEST-P2-002)", () => {
  const files = fs
    .readdirSync(ROUTES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => entry.name);

  it("every mutating router mounts requireAuth, and tenant routers mount requireOrgAccess", () => {
    const violations: string[] = [];

    for (const file of files) {
      const basename = file.replace(/\.ts$/, "");
      const content = fs.readFileSync(path.join(ROUTES_DIR, file), "utf8");
      if (!MUTATING_RE.test(content)) continue;

      if (!PUBLIC_MUTATING.has(basename) && !/\brequireAuth\b/.test(content)) {
        violations.push(`${basename}: mutating routes without requireAuth`);
      }

      const isGlobal = GLOBAL_MUTATING.has(basename) || PUBLIC_MUTATING.has(basename);
      const hasOrgGate =
        /\brequireOrgAccess\b/.test(content) || /\brequireOrgAccessByParam\b/.test(content);
      if (!isGlobal && !hasOrgGate) {
        violations.push(`${basename}: mutating routes without requireOrgAccess`);
      }
    }

    if (violations.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        "Mutating routers missing an authorization mount (add the middleware or document the exception):\n" +
          violations.map((v) => "  - " + v).join("\n"),
      );
    }

    expect(violations).toEqual([]);
  });
});
