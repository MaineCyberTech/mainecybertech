import { test, expect } from "../fixtures";

test.describe("portal qbr reports page", () => {
  test("renders QBR Reports heading", async ({ page }) => {
    await page.goto("/portal/qbr");
    await expect(page.getByRole("heading", { name: /qbr reports/i })).toBeVisible();
  });

  test("shows QBR list or empty state", async ({ page }) => {
    await page.goto("/portal/qbr");
    await expect(page.getByText(/qbr|report|period/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/qbr");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
