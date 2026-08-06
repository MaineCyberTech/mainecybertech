import { test, expect } from "../fixtures";

test.describe("portal status pages page", () => {
  test("renders status page heading", async ({ page }) => {
    await page.goto("/portal/status-pages");
    await expect(page.getByRole("heading", { name: /status page/i })).toBeVisible();
  });

  test("shows status components or empty state", async ({ page }) => {
    await page.goto("/portal/status-pages");
    await expect(page.getByText(/status|component|operational/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/status-pages");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
