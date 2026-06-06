import { test, expect } from "../fixtures";

test.describe("admin bulk invite page", () => {
  test("renders bulk invite heading", async ({ page }) => {
    await page.goto("/admin/bulk-invite");
    await expect(page.getByRole("heading", { name: /bulk user import/i })).toBeVisible();
  });

  test("shows organization selector", async ({ page }) => {
    await page.goto("/admin/bulk-invite");
    await expect(page.getByText(/organization/i).first()).toBeVisible();
  });

  test("shows csv textarea", async ({ page }) => {
    await page.goto("/admin/bulk-invite");
    await expect(page.locator("textarea")).toBeVisible();
  });

  test("has import button", async ({ page }) => {
    await page.goto("/admin/bulk-invite");
    await expect(page.getByRole("button", { name: /import/i })).toBeVisible();
  });
});
