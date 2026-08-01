import { test, expect } from "../fixtures";

test.describe("admin assets page", () => {
  test("renders assets heading", async ({ page }) => {
    await page.goto("/admin/assets");
    await expect(page.getByRole("heading", { name: "Assets", exact: true }).first()).toBeVisible();
  });

  test("shows asset list or empty state", async ({ page }) => {
    await page.goto("/admin/assets");
    await expect(page.getByText(/asset|active|retired|repair/i).first()).toBeVisible();
  });

  test("shows create button or empty state", async ({ page }) => {
    await page.goto("/admin/assets");
    const createBtn = page.getByRole("button", { name: /new asset/i });
    const emptyState = page.getByText(/no assets/i);
    await expect(createBtn.or(emptyState).first()).toBeVisible({ timeout: 10000 });
  });
});
