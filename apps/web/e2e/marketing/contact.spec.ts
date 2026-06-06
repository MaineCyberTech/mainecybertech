import { test, expect } from "../fixtures";

test.describe("contact page", () => {
  test("renders contact form and company info", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /contact us/i })).toBeVisible();
    await expect(page.getByText(/limington, me/i)).toBeVisible();
    await expect(page.getByText(/(207) 222-7525/i)).toBeVisible();
    await expect(page.getByText(/contact@mainecybertech.com/i)).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: /submit service request/i }).click();
    await expect(page.getByText(/required/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("phone link navigates to tel:", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("link", { name: /\(207\) 222-7525/i })).toHaveAttribute("href", "tel:+12072227525");
  });

  test("email link navigates to mailto:", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("link", { name: /contact@mainecybertech.com/i })).toHaveAttribute("href", "mailto:contact@mainecybertech.com");
  });
});
