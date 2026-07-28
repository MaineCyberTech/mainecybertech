import { test, expect } from "../fixtures";

test.describe("portal change requests page", () => {
  test("renders change requests heading", async ({ page }) => {
    await page.goto("/portal/change-requests");
    await expect(page.getByRole("heading", { name: /change requests/i })).toBeVisible();
  });

  test("shows change request list or empty state", async ({ page }) => {
    await page.goto("/portal/change-requests");
    await expect(page.getByText(/change request|approval|pending/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/change-requests");
    await expect(page.getByRole("link", { name: /portal/i })).toBeVisible();
  });
});
