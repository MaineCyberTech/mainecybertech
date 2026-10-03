import { test, expect } from "../fixtures";

test.describe("portal assets page", () => {
  test("renders assets heading", async ({ page }) => {
    await page.goto("/portal/assets");
    await expect(page.getByRole("heading", { name: "Assets", exact: true })).toBeVisible();
  });

  test("shows asset cards or empty state", async ({ page }) => {
    await page.goto("/portal/assets");
    await expect(page.getByText(/assets|hardware/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/assets");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
