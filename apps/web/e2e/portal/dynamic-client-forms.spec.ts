import { test, expect } from "../fixtures";

test.describe("portal dynamic forms page", () => {
  test("renders dynamic forms heading", async ({ page }) => {
    await page.goto("/portal/dynamic-client-forms-builder");
    await expect(
      page.getByRole("heading", { name: /dynamic client forms builder/i }),
    ).toBeVisible();
  });

  test("shows forms list or empty state", async ({ page }) => {
    await page.goto("/portal/dynamic-client-forms-builder");
    await expect(page.getByText(/form|intake|survey|questionnaire/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/dynamic-client-forms-builder");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
