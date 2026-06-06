import { test, expect } from "../fixtures";

test.describe("notification flow", () => {
  test("notification bell visible in admin header", async ({ page }) => {
    await page.goto("/admin");
    const bell = page.getByLabel(/notifications/i);
    await expect(bell).toBeVisible();
  });

  test("notification bell visible in portal header", async ({ page }) => {
    await page.goto("/portal/dashboard");
    const bell = page.getByLabel(/notifications/i);
    await expect(bell).toBeVisible();
  });

  test("notifications page renders with filters", async ({ page }) => {
    await page.goto("/portal/notifications");
    await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible();
    await expect(page.locator("select").first()).toBeVisible();
  });
});
