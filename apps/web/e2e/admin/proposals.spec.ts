import { test, expect } from "../fixtures";

test.describe("admin proposals page", () => {
  test("renders proposals heading", async ({ page }) => {
    await page.goto("/admin/proposals");
    await expect(page.getByRole("heading", { name: /proposal builder/i })).toBeVisible();
  });

  test("shows proposal list or empty state", async ({ page }) => {
    await page.goto("/admin/proposals");
    await expect(page.getByText(/proposal|draft|sent|approved/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/admin/proposals");
    await expect(page.getByText(/admin/i).first()).toBeVisible();
  });
});
