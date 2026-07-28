import { test, expect } from "../fixtures";

test.describe("portal m365 hardening page", () => {
  test("renders m365 hardening heading", async ({ page }) => {
    await page.goto("/portal/m365-hardening");
    await expect(page.getByRole("heading", { name: /m365 hardening/i })).toBeVisible();
  });

  test("shows hardening status or empty state", async ({ page }) => {
    await page.goto("/portal/m365-hardening");
    await expect(page.getByText(/hardening|secure|m365/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/m365-hardening");
    await expect(page.getByRole("link", { name: /portal/i })).toBeVisible();
  });
});
