import { test, expect } from "../fixtures";

test.describe("portal patch compliance page", () => {
  test("renders patch compliance heading", async ({ page }) => {
    await page.goto("/portal/patch-compliance");
    await expect(page.getByRole("heading", { name: /patch compliance/i })).toBeVisible();
  });

  test("shows patch status or empty state", async ({ page }) => {
    await page.goto("/portal/patch-compliance");
    await expect(page.getByText(/patch|compliance|update/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/patch-compliance");
    await expect(page.getByRole("link", { name: /portal/i })).toBeVisible();
  });
});
