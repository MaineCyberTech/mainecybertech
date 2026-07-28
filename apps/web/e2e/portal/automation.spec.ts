import { test, expect } from "../fixtures";

test.describe("portal automation page", () => {
  test("renders automation heading", async ({ page }) => {
    await page.goto("/portal/automation");
    await expect(page.getByRole("heading", { name: /automation/i })).toBeVisible();
  });

  test("shows automation list or empty state", async ({ page }) => {
    await page.goto("/portal/automation");
    await expect(page.getByText(/automation|workflow|script/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/automation");
    await expect(page.getByRole("link", { name: /portal/i })).toBeVisible();
  });
});
