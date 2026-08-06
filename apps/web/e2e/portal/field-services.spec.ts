import { test, expect } from "../fixtures";

test.describe("portal field services page", () => {
  test("renders field services heading", async ({ page }) => {
    await page.goto("/portal/field-services");
    await expect(page.getByRole("heading", { name: /field services/i })).toBeVisible();
  });

  test("shows ISP assessment list or empty state", async ({ page }) => {
    await page.goto("/portal/field-services");
    await expect(page.getByText(/isp assessment|no isp assessments found/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/field-services");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
