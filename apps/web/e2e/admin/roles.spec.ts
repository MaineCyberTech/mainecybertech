import { test, expect } from "../fixtures";

test.describe("admin roles page", () => {
  test("renders roles heading", async ({ page }) => {
    await page.goto("/admin/roles");
    await expect(page.getByRole("heading", { name: /roles/i })).toBeVisible();
  });

  test("shows role list or empty state", async ({ page }) => {
    await page.goto("/admin/roles");
    await expect(page.getByText(/super admin|admin|no roles/i).first()).toBeVisible();
  });
});

test.describe("admin role detail", () => {
  test("navigates to role detail and shows permission matrix", async ({ page }) => {
    await page.goto("/admin/roles");
    const roleLink = page.locator("a[href*='/admin/roles/']").first();
    if (await roleLink.isVisible()) {
      await roleLink.click();
      await expect(page.getByText(/permission toggles|permissions/i).first()).toBeVisible();
    }
  });
});
