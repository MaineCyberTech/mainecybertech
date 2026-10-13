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
    const dropdown = page.getByText(/no results|users|organizations|tickets|projects|documents/i);
    await expect(dropdown.first()).toBeVisible({ timeout: 10000 });
  });

  test("short query does not trigger search", async ({ page }) => {
    await page.goto("/admin");
    const searchInput = page.getByPlaceholder(/search/i).first();

    // A 1-char query is below the component's 2-char minimum, so no search
    // request may be issued. Watch the network instead of sleeping: the
    // promise resolves (and the assertion fails) if one fires, and otherwise
    // times out just past the 300ms debounce window.
    const searchFired = page
      .waitForRequest((request) => request.url().includes("/api/v1/search"), { timeout: 1_000 })
      .then(() => true)
      .catch(() => false);

    await searchInput.fill("a");

    expect(await searchFired).toBe(false);
    await expect(page.getByText(/no results/i)).not.toBeVisible();
  });
});
