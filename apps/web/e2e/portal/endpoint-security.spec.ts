import { test, expect } from "../fixtures";

test.describe("portal endpoint security page", () => {
  test("renders endpoint security heading", async ({ page }) => {
    await page.goto("/portal/endpoint-security");
    await expect(page.getByRole("heading", { name: /endpoint security/i })).toBeVisible();
  });

  test("shows endpoint list or empty state", async ({ page }) => {
    await page.goto("/portal/endpoint-security");
    await expect(page.getByText(/endpoint|device|agent/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/endpoint-security");
    await expect(page.getByRole("link", { name: /portal/i })).toBeVisible();
  });
});
