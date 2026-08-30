import { test, expect } from "../fixtures";

test.describe("admin findings page", () => {
  test("renders findings heading", async ({ page }) => {
    await page.goto("/admin/findings");
    await expect(page.getByRole("heading", { name: /open findings & remediation/i })).toBeVisible();
  });

  test("shows severity stats or empty state", async ({ page }) => {
    await page.goto("/admin/findings");
    await expect(page.getByText(/p0|p1|p2|p3|findings|severity/i).first()).toBeVisible();
  });

  test("shows create button or empty state", async ({ page }) => {
    await page.goto("/admin/findings");
    const createBtn = page.getByRole("button", { name: /new finding/i });
    const emptyState = page.getByText(/no findings/i);
    await expect(createBtn.or(emptyState).first()).toBeVisible({ timeout: 10000 });
  });
});
