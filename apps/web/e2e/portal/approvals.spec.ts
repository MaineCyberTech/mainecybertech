import { test, expect } from "../fixtures";

test.describe("portal approvals page", () => {
  test("renders approvals heading", async ({ page }) => {
    await page.goto("/portal/approvals");
    await expect(page.getByRole("heading", { name: /approvals/i })).toBeVisible();
  });

  test("shows approval list or empty state", async ({ page }) => {
    await page.goto("/portal/approvals");
    await expect(page.getByText(/approval|pending|request/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/approvals");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
