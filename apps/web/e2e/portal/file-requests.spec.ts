import { test, expect } from "../fixtures";

test.describe("portal file requests page", () => {
  test("renders file requests heading", async ({ page }) => {
    await page.goto("/portal/file-requests");
    await expect(
      page.getByRole("heading", { name: /secure file requests/i })
    ).toBeVisible();
  });

  test("shows file request list or empty state", async ({ page }) => {
    await page.goto("/portal/file-requests");
    await expect(page.getByText(/file request/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/file-requests");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
