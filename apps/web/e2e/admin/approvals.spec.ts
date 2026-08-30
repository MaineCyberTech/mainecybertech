import { test, expect } from "../fixtures";

test.describe("admin approvals queue", () => {
  test("renders approvals heading", async ({ page }) => {
    await page.goto("/admin/approvals");
    await expect(page.getByRole("heading", { name: /approval queue/i })).toBeVisible();
  });

  test("shows pending organizations section", async ({ page }) => {
    await page.goto("/admin/approvals");
    await expect(page.getByText(/pending organizations/i).first()).toBeVisible();
  });

  test("shows pending memberships section", async ({ page }) => {
    await page.goto("/admin/approvals");
    await expect(page.getByText(/pending memberships/i).first()).toBeVisible();
  });
});
