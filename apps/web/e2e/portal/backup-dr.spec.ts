import { test, expect } from "../fixtures";

test.describe("portal backup and dr page", () => {
  test("renders backup and dr heading", async ({ page }) => {
    await page.goto("/portal/backup-dr");
    await expect(page.getByRole("heading", { name: /backup|disaster recovery/i })).toBeVisible();
  });

  test("shows backup status or empty state", async ({ page }) => {
    await page.goto("/portal/backup-dr");
    await expect(page.getByText(/backup|disaster|recovery|dr/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/backup-dr");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
