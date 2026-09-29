import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

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
    { path: "/portal/notifications", name: "portal notifications" },
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
    { path: "/portal/client-knowledge-base", name: "portal knowledge base" },
    { path: "/portal/profile/security", name: "portal security settings" },
    { path: "/admin/organizations", name: "admin organizations" },
    { path: "/admin/roles", name: "admin roles" },
    { path: "/admin/audit", name: "admin audit" },
    { path: "/admin/findings", name: "admin findings" },
    { path: "/admin/assets", name: "admin assets" },
    { path: "/admin/licenses", name: "admin licenses" },
    { path: "/admin/service-catalog", name: "admin service catalog" },
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
  const pages = full ? [...BASE_PAGES, ...FULL_PAGES] : BASE_PAGES;
  const tags = full
    ? ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
    : ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

  for (const page of pages) {
    test(`${page.name} has no critical axe violations`, async ({ page: p }) => {
      await p.goto(page.path);
      await p.waitForLoadState("domcontentloaded");
      // Let client-side data/hydration settle so axe scans the rendered DOM
      // rather than a mid-load skeleton (which intermittently trips
      // landmark/created-element rules). Bounded: the notification bell's
      // EventSource can keep the connection busy, so fall through on timeout.
      await p.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
      const results = await new AxeBuilder({ page: p }).withTags(tags).analyze();

      const violations = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );

      expect(
        violations.map((v) => `${v.id} (${v.impact}): ${v.help}`),
        `Critical/serious a11y violations on ${page.path}`,
      ).toEqual([]);
    });
  }
});
