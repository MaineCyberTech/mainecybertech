import { test, expect } from "../fixtures";

test.describe("portal budgets page", () => {
  test("renders budget roadmap heading", async ({ page }) => {
    await page.goto("/portal/budgets");
    await expect(page.getByRole("heading", { name: /budget roadmap/i })).toBeVisible();
  });

  test("shows budget item list or empty state", async ({ page }) => {
    await page.goto("/portal/budgets");
    await expect(page.getByText(/budget|category|priority|item|found/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/budgets");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
