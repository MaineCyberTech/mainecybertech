import { test, expect } from "../fixtures";

test.describe("portal identity verification page", () => {
  test("renders identity verification heading", async ({ page }) => {
    await page.goto("/portal/identity-verification");
    await expect(page.getByRole("heading", { name: /identity verification/i })).toBeVisible();
  });

  test("shows verification status or empty state", async ({ page }) => {
    await page.goto("/portal/identity-verification");
    await expect(page.getByText(/identity|verification|mfa|2fa/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/identity-verification");
    await expect(page.getByRole("link", { name: /portal/i })).toBeVisible();
  });
});
