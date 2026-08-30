import { test, expect } from "../fixtures";

test.describe("admin domain monitors", () => {
  test("renders domain monitor heading", async ({ page }) => {
    await page.goto("/admin/domain-monitors");
    await expect(page.getByRole("heading", { name: /domain health monitor/i })).toBeVisible();
  });

  test("shows monitor list or empty state", async ({ page }) => {
    await page.goto("/admin/domain-monitors");
    await expect(page.getByText(/domain|monitor|ok|fail|dns/i).first()).toBeVisible();
  });

  test("shows create button or empty state", async ({ page }) => {
    await page.goto("/admin/domain-monitors");
    const createBtn = page.getByRole("button", { name: /new domain/i });
    const emptyState = page.getByText(/no domains/i);
    await expect(createBtn.or(emptyState).first()).toBeVisible({ timeout: 10000 });
  });
});
