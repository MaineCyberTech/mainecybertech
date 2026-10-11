import { test, expect, gotoApp } from "../fixtures";

test.describe("notification flow", () => {
  test("notification bell visible in admin header", async ({ page }) => {
    await gotoApp(page, "/admin");
    const bell = page.getByLabel(/notifications/i);
    await expect(bell).toBeVisible();
  });

  test("notification bell visible in portal header", async ({ page }) => {
    await gotoApp(page, "/portal/dashboard");
    const bell = page.getByLabel(/notifications/i);
    await expect(bell).toBeVisible();
  });

  test("notifications page renders with filters", async ({ page }) => {
    await gotoApp(page, "/portal/notifications");
    await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible();
    await expect(page.locator("select").first()).toBeVisible();
  });
});
