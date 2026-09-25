import { test, expect } from "../fixtures";

test.describe("portal vendor contacts page", () => {
  test("renders vendor contacts heading", async ({ page }) => {
    await page.goto("/portal/vendor-contacts");
    await expect(page.getByRole("heading", { name: /vendor contacts/i })).toBeVisible();
  });

  test("shows contact list or empty state", async ({ page }) => {
    await page.goto("/portal/vendor-contacts");
    await expect(page.getByText(/vendor|contact|primary|email|phone/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/vendor-contacts");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
