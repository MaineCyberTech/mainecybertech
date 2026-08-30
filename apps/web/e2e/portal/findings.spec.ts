import { test, expect } from "../fixtures";

test.describe("portal findings page", () => {
  test("renders findings heading", async ({ page }) => {
    await page.goto("/portal/findings");
    await expect(page.getByRole("heading", { name: /findings/i })).toBeVisible();
  });

  test("shows findings list or empty state", async ({ page }) => {
    await page.goto("/portal/findings");
    await expect(page.getByText(/findings|no findings/i).first()).toBeVisible();
  });

  test("shows dashboard back link", async ({ page }) => {
    await page.goto("/portal/findings");
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
  });
});
