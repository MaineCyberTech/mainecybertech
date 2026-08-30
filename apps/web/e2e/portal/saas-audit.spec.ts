import { test, expect } from "../fixtures";

test.describe("portal saas audit page", () => {
  test("renders saas audit heading", async ({ page }) => {
    await page.goto("/portal/saas-audit");
    await expect(page.getByRole("heading", { name: /saas subscription audit/i })).toBeVisible();
  });

  test("shows subscription list or empty state", async ({ page }) => {
    await page.goto("/portal/saas-audit");
    await expect(page.getByText(/subscription|no saas subscriptions found/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/saas-audit");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
