import { test, expect } from "../fixtures";

test.describe("portal domain monitors page", () => {
  test("renders Domain Monitors heading", async ({ page }) => {
    await page.goto("/portal/domain-monitors");
    await expect(page.getByRole("heading", { name: /domain monitors/i })).toBeVisible();
  });

  test("shows domain list or empty state", async ({ page }) => {
    await page.goto("/portal/domain-monitors");
    await expect(page.getByText(/domain|monitor|ssl|spf|dkim|dmarc/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/domain-monitors");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
