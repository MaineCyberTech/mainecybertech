import { test, expect } from "../fixtures";

test.describe("admin health dashboard", () => {
  test("renders health heading", async ({ page }) => {
    await page.goto("/admin/health");
    await expect(page.getByRole("heading", { name: /service health/i })).toBeVisible();
  });

  test("shows service status cards", async ({ page }) => {
    await page.goto("/admin/health");
    await expect(page.getByText(/api server|database|worker/i).first()).toBeVisible();
  });

  test("has refresh button", async ({ page }) => {
    await page.goto("/admin/health");
    await expect(page.getByRole("button", { name: /refresh/i })).toBeVisible();
  });
});
