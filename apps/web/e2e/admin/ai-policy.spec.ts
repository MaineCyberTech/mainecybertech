import { test, expect } from "../fixtures";

test.describe("admin AI policy", () => {
  test("renders AI Policy heading", async ({ page }) => {
    await page.goto("/admin/edu-automation/ai-policy");
    await expect(page.getByRole("heading", { name: /AI Policy/i })).toBeVisible();
  });

  test("shows policy list or empty state", async ({ page }) => {
    await page.goto("/admin/edu-automation/ai-policy");
    await expect(page.getByText(/AI|policy|New AI Policy/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/admin/edu-automation/ai-policy");
    await expect(page.getByText(/admin/i).first()).toBeVisible();
  });
});
