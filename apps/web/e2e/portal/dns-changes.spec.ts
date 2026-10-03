import { test, expect } from "../fixtures";

test.describe("portal dns changes page", () => {
  test("renders dns change requests heading", async ({ page }) => {
    await page.goto("/portal/dns-changes");
    await expect(page.getByRole("heading", { name: /dns change requests/i })).toBeVisible();
  });

  test("shows change request list or empty state", async ({ page }) => {
    await page.goto("/portal/dns-changes");
    await expect(
      page.getByText(/change request|proposed|no dns change requests found/i).first(),
    ).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/dns-changes");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
