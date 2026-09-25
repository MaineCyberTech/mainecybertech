import { test, expect } from "../fixtures";

test.describe("portal license optimizer page", () => {
  test("renders license optimizer heading", async ({ page }) => {
    await page.goto("/portal/license-optimizer");
    await expect(page.getByRole("heading", { name: /license optimizer/i })).toBeVisible();
  });

  test("shows license list or empty state", async ({ page }) => {
    await page.goto("/portal/license-optimizer");
    await expect(page.getByText(/license|seat|utilization/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/license-optimizer");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
