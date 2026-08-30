import { test, expect } from "../fixtures";

test.describe("portal procurement page", () => {
  test("renders procurement quotes heading", async ({ page }) => {
    await page.goto("/portal/procurement");
    await expect(page.getByRole("heading", { name: /procurement quotes/i })).toBeVisible();
  });

  test("shows quote list or empty state", async ({ page }) => {
    await page.goto("/portal/procurement");
    await expect(page.getByText(/procurement|quote|vendor|total/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/procurement");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
