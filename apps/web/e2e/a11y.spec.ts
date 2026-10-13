import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { test, expect, gotoApp } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

/**
 * Known critical/serious axe violations tolerated by the A11Y_FULL breadth
 * scan (`a11y-baseline.json`). The default 25-route gate is zero-tolerance;
 * the baseline only filters the full run so new violations fail while
 * explicitly recorded debt does not. Regenerate with
 * `A11Y_FULL=1 A11Y_UPDATE_BASELINE=1 pnpm --filter=web e2e -- a11y.spec.ts`
 * (single worker) and review the diff.
 */
type BaselineEntry = { route: string; rule: string; target?: string };

type FlatViolation = { id: string; text: string; targets: string[] };

test.describe("accessibility scan", () => {
  const BASE_PAGES = [
    { path: "/login", name: "login" },
    { path: "/signup", name: "signup" },
    { path: "/store", name: "public store" },
    { path: "/case-studies", name: "case studies" },
    { path: "/resources", name: "resources" },
    { path: "/privacy", name: "privacy" },
    { path: "/terms", name: "terms" },
    { path: "/status", name: "status index" },
    { path: "/portal/dashboard", name: "portal dashboard" },
    { path: "/admin", name: "admin dashboard" },
    { path: "/portal/support", name: "portal tickets" },
    { path: "/portal/projects", name: "portal projects" },
    { path: "/portal/documents", name: "portal documents" },
    { path: "/portal/profile", name: "portal profile" },
    { path: "/portal/assets", name: "portal assets" },
    { path: "/admin/tickets", name: "admin tickets" },
    { path: "/admin/projects", name: "admin projects" },
    { path: "/admin/users", name: "admin users" },
    { path: "/portal/findings", name: "portal findings" },
    // Promoted from FULL_PAGES after the 2026-10-02 breadth scan went green.
    { path: "/portal/notifications", name: "portal notifications" },
    { path: "/portal/client-knowledge-base", name: "portal knowledge base" },
    { path: "/admin/findings", name: "admin findings" },
    { path: "/admin/assets", name: "admin assets" },
    { path: "/admin/licenses", name: "admin licenses" },
    { path: "/admin/service-catalog", name: "admin service catalog" },
  ];

  // Broader triage set: run with A11Y_FULL=1 (see .github/workflows/a11y-breadth.yml).
  // Kept out of the default gate so new rules are triaged rather than failing
  // the prod E2E gate blind.
  const FULL_PAGES = [
    { path: "/", name: "marketing home" },
    { path: "/contact", name: "contact" },
    { path: "/store/compare", name: "store compare" },
    { path: "/blog", name: "blog" },
    { path: "/store/quote", name: "store quote" },
    { path: "/portal/approvals", name: "portal approvals" },
    { path: "/portal/budgets", name: "portal budgets" },
    { path: "/portal/status", name: "portal status" },
    { path: "/portal/runbooks", name: "portal runbooks" },
    { path: "/portal/risk-register", name: "portal risk register" },
    { path: "/portal/sop-library", name: "portal SOP library" },
    { path: "/portal/training-hub", name: "portal training hub" },
    { path: "/portal/qbr", name: "portal QBR" },
    { path: "/portal/compliance-readiness", name: "portal compliance readiness" },
    { path: "/portal/incident-response", name: "portal incident response" },
    { path: "/portal/service-catalog", name: "portal service catalog" },
    { path: "/portal/vendor-contracts", name: "portal vendor contracts" },
    { path: "/portal/profile/security", name: "portal security settings" },
    { path: "/admin/organizations", name: "admin organizations" },
    { path: "/admin/roles", name: "admin roles" },
    { path: "/admin/audit", name: "admin audit" },
    { path: "/admin/governance", name: "admin governance" },
    { path: "/admin/approval-requests", name: "admin approval requests" },
    { path: "/admin/dmarc", name: "admin dmarc" },
    { path: "/admin/domain-monitors", name: "admin domain monitors" },
    { path: "/admin/break-glass", name: "admin break glass" },
    { path: "/admin/incidents", name: "admin incidents" },
    { path: "/admin/onboarding", name: "admin onboarding" },
    { path: "/admin/offboarding", name: "admin offboarding" },
    { path: "/admin/patch-compliance", name: "admin patch compliance" },
    { path: "/admin/training-hub", name: "admin training hub" },
    { path: "/admin/uptime-monitor", name: "admin uptime monitor" },
    { path: "/admin/vendor-contracts", name: "admin vendor contracts" },
    { path: "/admin/webhooks", name: "admin webhooks" },
    { path: "/admin/webhooks/dead-letters", name: "admin dead letters" },
    { path: "/admin/store/products", name: "admin store products" },
    { path: "/admin/store/categories", name: "admin store categories" },
    { path: "/admin/store/promotions", name: "admin store promotions" },
    { path: "/admin/store/quotes", name: "admin store quotes" },
    { path: "/admin/store/quote-requests", name: "admin store quote requests" },
    { path: "/admin/store/leads", name: "admin store leads" },
    { path: "/admin/store/campaigns", name: "admin store campaigns" },
    { path: "/admin/store/operations", name: "admin store operations" },
  ];

  const full = process.env.A11Y_FULL === "1";
  const updateBaseline = full && process.env.A11Y_UPDATE_BASELINE === "1";
  const pages = full ? [...BASE_PAGES, ...FULL_PAGES] : BASE_PAGES;
  // wcag22aa is gated everywhere as of 2026-10-02 (the breadth scan is green).
  const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

  const baselinePath = path.join(__dirname, "a11y-baseline.json");

  function readBaseline(): BaselineEntry[] {
    if (!full || updateBaseline) return [];
    try {
      const parsed = JSON.parse(fs.readFileSync(baselinePath, "utf8")) as {
        violations?: BaselineEntry[];
      };
      return parsed.violations ?? [];
    } catch (error) {
      // A missing/corrupt baseline must fail closed, not silently widen the scan.
      throw new Error(`Could not read ${baselinePath}: ${String(error)}`);
    }
  }

  const baseline = readBaseline();
  const observed: BaselineEntry[] = [];

  function isBaselined(context: string, violation: FlatViolation): boolean {
    return baseline.some((entry) => {
      if (entry.route !== context || entry.rule !== violation.id) return false;
      if (!entry.target) return true;
      const target = entry.target;
      return violation.targets.some((node) => node.includes(target));
    });
  }

  /** Run axe on the current page state and flatten critical/serious results. */
  async function scan(page: Page): Promise<FlatViolation[]> {
    const results = await new AxeBuilder({ page }).withTags(tags).analyze();
    return results.violations
      .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
      .map((violation) => ({
        id: violation.id,
        text: `${violation.id} (${violation.impact ?? "unknown"}): ${violation.help} [${violation.nodes
          .map((node) => node.target.join(" "))
          .join("; ")}]`,
        targets: violation.nodes.map((node) => node.target.join(" ")),
      }));
  }

  /**
   * Assert the current page state is clean. In baseline-update mode the
   * observed rules are recorded and the assertion is skipped; the file is
   * written by the afterAll hook (run with a single worker). Otherwise
   * violations not covered by the baseline fail the test.
   */
  async function expectNoCriticalViolations(page: Page, context: string): Promise<void> {
    const violations = await scan(page);

    if (updateBaseline) {
      for (const violation of violations) {
        if (!observed.some((entry) => entry.route === context && entry.rule === violation.id)) {
          observed.push({ route: context, rule: violation.id });
        }
      }
      return;
    }

    const unexpected = violations.filter((violation) => !isBaselined(context, violation));
    const tolerated = violations.length - unexpected.length;
    expect(
      unexpected.map((violation) => violation.text),
      `Critical/serious a11y violations on ${context}${
        tolerated > 0 ? ` (${tolerated} baselined)` : ""
      }`,
    ).toEqual([]);
  }

  test.afterAll(() => {
    if (!updateBaseline) return;
    const file = {
      note:
        "Known critical/serious axe violations tolerated by the A11Y_FULL breadth scan. " +
        "Empty means zero-tolerance. Entries are {route, rule, target?}; drop an entry once " +
        "fixed. Regenerate with A11Y_FULL=1 A11Y_UPDATE_BASELINE=1 (single worker).",
      violations: observed,
    };
    fs.writeFileSync(baselinePath, `${JSON.stringify(file, null, 2)}\n`);
  });

  for (const page of pages) {
    test(`${page.name} has no critical axe violations`, async ({ page: p }) => {
      await p.goto(page.path);
      await p.waitForLoadState("domcontentloaded");
      // Let client-side data/hydration settle so axe scans the rendered DOM
      // rather than a mid-load skeleton (which intermittently trips
      // landmark/created-element rules). Bounded: the notification bell's
      // EventSource can keep the connection busy, so fall through on timeout.
      await p.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
      await expectNoCriticalViolations(p, page.path);
    });
  }

  // UX-P3-011: the page loop only scans the initial load, so dialogs, drawers,
  // filters and bulk-selection bars were never exercised. Bounded set: the
  // highest-traffic interactive states with stable, seeded triggers. Each
  // context string is what the baseline file keys on.
  test.describe("interactive states", () => {
    test("admin tickets bulk-selection bar has no critical axe violations", async ({ page }) => {
      await gotoApp(page, "/admin/tickets");
      const rowCheckbox = page.getByLabel("Select ticket").first();
      await expect(rowCheckbox).toBeVisible({ timeout: 20_000 });
      await rowCheckbox.check();
      await expect(page.getByLabel("Bulk action")).toBeVisible();
      await expectNoCriticalViolations(page, "/admin/tickets#bulk-selection");
    });

    test("admin tickets status filter chip has no critical axe violations", async ({ page }) => {
      await gotoApp(page, "/admin/tickets");
      const statusFilter = page.getByLabel("Filter by status");
      await expect(statusFilter).toBeVisible({ timeout: 20_000 });
      await statusFilter.selectOption("open");
      await expect(page.getByRole("button", { name: /remove status: open/i })).toBeVisible();
      await expectNoCriticalViolations(page, "/admin/tickets#status-filter");
    });

    test("store categories drawer has no critical axe violations", async ({ page }) => {
      // The drawer toggle only renders below the `lg` breakpoint; scan it at a
      // narrow width so the overlay and its focus trap are mounted.
      await page.setViewportSize({ width: 800, height: 900 });
      await page.goto("/store");
      const toggle = page.getByRole("button", { name: "Browse categories" });
      await expect(toggle).toBeVisible({ timeout: 20_000 });
      await toggle.click();
      await expect(page.getByRole("dialog", { name: "Store menu" })).toBeVisible();
      await expectNoCriticalViolations(page, "/store#categories-drawer");
    });

    test("create-promotion dialog has no critical axe violations", async ({ page }) => {
      await gotoApp(page, "/admin/store/promotions");
      const openButton = page.getByRole("button", { name: /create promotion/i });
      await expect(openButton).toBeVisible({ timeout: 20_000 });
      await openButton.click();
      await expect(page.getByRole("dialog", { name: /create promotion/i })).toBeVisible();
      await expectNoCriticalViolations(page, "/admin/store/promotions#create-dialog");
    });
  });
});
