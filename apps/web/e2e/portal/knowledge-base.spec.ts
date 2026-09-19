import { test, expect, setActiveOrg } from "../fixtures";

// Seed org that the GAP module demo data is scoped to (seed 06/08).
const GAP_ORG = "11111111-1111-1111-1111-111111111111";

test.describe("portal knowledge base page", () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
    });
    page.on("response", (resp) => {
      if (resp.status() >= 500) errors.push(`HTTP ${resp.status()} ${resp.url()}`);
    });
    (page as unknown as { __diag?: string[] }).__diag = errors;

    await setActiveOrg(page, GAP_ORG);
    const resp = await page.goto("/portal/client-knowledge-base");
    if (page.url().includes("/login")) {
      throw new Error(
        `Redirected to /login (status ${resp?.status()}). Session likely missing for this spec. Diag: ${(page as unknown as { __diag?: string[] }).__diag?.join(" | ") ?? "none"}`,
      );
    }
  });

  test.afterEach(async ({ page }) => {
    const errors = (page as unknown as { __diag?: string[] }).__diag ?? [];
    if (errors.length) {
      // eslint-disable-next-line no-console
      console.warn(`[knowledge-base] captured diagnostics: ${errors.join(" | ")}`);
    }
  });

  test("renders knowledge base heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /knowledge base/i })).toBeVisible();
  });

  test("shows article list or empty state", async ({ page }) => {
    await expect(page.getByText(/knowledge|article|guide/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
