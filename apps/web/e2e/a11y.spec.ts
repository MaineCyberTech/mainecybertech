import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

test.describe("accessibility scan", () => {
  const pages = [
    { path: "/login", name: "login" },
    { path: "/store", name: "public store" },
    { path: "/portal/dashboard", name: "portal dashboard" },
    { path: "/admin", name: "admin dashboard" },
  ];

  for (const page of pages) {
    test(`${page.name} has no critical axe violations`, async ({ page: p }) => {
      await p.goto(page.path);
      await p.waitForLoadState("domcontentloaded");
      const results = await new AxeBuilder({ page: p })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

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
