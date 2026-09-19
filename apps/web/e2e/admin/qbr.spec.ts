import { test, expect } from "../fixtures";

test.describe("admin QBR reports", () => {
  test("renders QBR heading", async ({ page }) => {
    await page.goto("/admin/qbr");
    await expect(page.getByRole("heading", { name: /QBR executive reports/i })).toBeVisible();
  });

  test("shows list or empty state", async ({ page }) => {
    await page.goto("/admin/qbr");
    const content = page.getByText(/QBR|report|create/i).first();
    await expect(content).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/admin/qbr");
    await expect(page.getByText(/admin/i).first()).toBeVisible();
  });
});
