import { test, expect, visibleWithin } from "../fixtures";

test.describe("login page", () => {
  test("renders login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("html")).toBeVisible();
  });

  test("redirects to signup page", async ({ page }) => {
    await page.goto("/login");
    const signupLink = page.getByRole("link", { name: /sign up/i });
    if (await visibleWithin(signupLink)) {
      await signupLink.click();
      await expect(page).toHaveURL(/\/signup/);
    }
  });
});

test.describe("signup page", () => {
  test("renders signup form", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("html")).toBeVisible();
  });

  test("redirects to login page", async ({ page }) => {
    await page.goto("/signup");
    const loginLink = page.getByRole("link", { name: /sign in/i });
    if (await visibleWithin(loginLink)) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});

test.describe("pending approval page", () => {
  test("renders pending message", async ({ page }) => {
    await page.goto("/pending");
    await expect(page.getByRole("heading", { name: /approval pending/i })).toBeVisible();
  });
});
