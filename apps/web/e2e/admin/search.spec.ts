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
    // The dropdown opens after a 300ms debounce; rely on the auto-waiting
    // assertion instead of a fixed sleep.
    const dropdown = page.getByText(/no results|users|organizations|tickets|projects/i);
    await expect(dropdown.first()).toBeVisible({ timeout: 10000 });
  });

  test("short query does not trigger search", async ({ page }) => {
    await page.goto("/admin");
    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill("a");
    // Negative assertion: wait past the debounce window to prove the query
    // was ignored (absence cannot be awaited like presence).
    await page.waitForTimeout(600);
    await expect(page.getByText(/no results/i)).not.toBeVisible();
  });
});
