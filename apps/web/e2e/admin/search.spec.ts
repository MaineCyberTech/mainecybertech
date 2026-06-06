import { test, expect } from "../fixtures";

test.describe("admin global search", () => {
  test("search input exists in admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByPlaceholder(/search/i).first()).toBeVisible();
  });

  test("typing shows results dropdown", async ({ page }) => {
    await page.goto("/admin");
    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill("test");
    await page.waitForTimeout(500);
    const dropdown = page.getByText(/no results|users|organizations|tickets|projects/i);
    await expect(dropdown.first()).toBeVisible({ timeout: 5000 });
  });

  test("short query does not trigger search", async ({ page }) => {
    await page.goto("/admin");
    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill("a");
    await page.waitForTimeout(500);
    await expect(page.getByText(/no results/i)).not.toBeVisible();
  });
});
