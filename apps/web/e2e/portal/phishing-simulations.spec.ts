import { test, expect } from "../fixtures";

test.describe("portal phishing simulations page", () => {
  test("renders phishing simulations heading", async ({ page }) => {
    await page.goto("/portal/phishing-simulations");
    await expect(page.getByRole("heading", { name: /phishing/i })).toBeVisible();
  });

  test("shows simulation list or empty state", async ({ page }) => {
    await page.goto("/portal/phishing-simulations");
    await expect(page.getByText(/phishing|simulation|campaign/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/phishing-simulations");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
