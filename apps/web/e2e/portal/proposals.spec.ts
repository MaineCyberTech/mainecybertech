import { test, expect } from "../fixtures";

test.describe("portal proposals page", () => {
  test("renders proposals heading", async ({ page }) => {
    await page.goto("/portal/proposals");
    await expect(page.getByRole("heading", { name: /proposals/i })).toBeVisible();
  });

  test("shows proposal list or empty state", async ({ page }) => {
    await page.goto("/portal/proposals");
    await expect(page.getByText(/proposal|no proposals yet/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/proposals");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
