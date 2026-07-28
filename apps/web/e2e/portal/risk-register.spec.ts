import { test, expect } from "../fixtures";

test.describe("portal risk register page", () => {
  test("renders risk register heading", async ({ page }) => {
    await page.goto("/portal/risk-register");
    await expect(page.getByRole("heading", { name: /risk register/i })).toBeVisible();
  });

  test("shows risk list or empty state", async ({ page }) => {
    await page.goto("/portal/risk-register");
    await expect(page.getByText(/risk|register|mitigation/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/risk-register");
    await expect(page.getByRole("link", { name: /portal/i })).toBeVisible();
  });
});
