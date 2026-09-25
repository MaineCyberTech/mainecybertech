import { test, expect } from "../fixtures";

test.describe("portal service catalog page", () => {
  test("renders service catalog heading", async ({ page }) => {
    await page.goto("/portal/service-catalog");
    await expect(page.getByRole("heading", { name: /service catalog/i })).toBeVisible();
  });

  test("shows services list or empty state", async ({ page }) => {
    await page.goto("/portal/service-catalog");
    await expect(
      page
        .getByText(/services for your organization|base price|bundled|no services in catalog/i)
        .first(),
    ).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/service-catalog");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
