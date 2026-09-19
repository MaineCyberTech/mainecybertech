import { test, expect } from "../fixtures";

test.describe("admin business OS dashboard", () => {
  test("renders dashboard heading", async ({ page }) => {
    await page.goto("/admin/business-os");
    await expect(page.getByRole("heading", { name: /business os dashboard/i })).toBeVisible();
  });

  test("shows platform activity section", async ({ page }) => {
    await page.goto("/admin/business-os");
    await expect(page.getByText(/platform activity/i).first()).toBeVisible();
  });

  test("shows organization health section", async ({ page }) => {
    await page.goto("/admin/business-os");
    await expect(page.getByText(/organization health/i).first()).toBeVisible();
  });
});
