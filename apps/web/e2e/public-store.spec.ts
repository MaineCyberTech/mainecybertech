import { test, expect } from "./fixtures";

test.describe("public store homepage", () => {
  test("renders hero section with heading", async ({ page }) => {
    await page.goto("/store");
    await expect(
      page.getByRole("heading", { name: /browse our services/i }),
    ).toBeVisible();
    await expect(page.getByText(/every service includes clear scope/i)).toBeVisible();
  });

  test("renders category cards with links", async ({ page }) => {
    await page.goto("/store");
    await expect(page.getByRole("heading", { name: /browse by category/i })).toBeVisible();
    const quickFixes = page.getByRole("link", { name: /quick fixes/i });
    await expect(quickFixes.first()).toBeVisible();
    await expect(quickFixes.first()).toHaveAttribute(
      "href",
      "/store/category/quick-fixes",
    );
  });

  test("renders quick wins, monthly plans, and emergency sections", async ({ page }) => {
    await page.goto("/store");
    await expect(page.getByRole("heading", { name: /quick wins/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /monthly it plans/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /emergency support/i })).toBeVisible();
  });

  test("links to quiz, compare, and quote builder", async ({ page }) => {
    await page.goto("/store");
    await expect(page.getByRole("link", { name: /service finder/i })).toHaveAttribute(
      "href",
      "/store/quiz",
    );
    await expect(page.getByRole("link", { name: /quote builder/i })).toHaveAttribute(
      "href",
      "/store/quote",
    );
    await expect(page.getByRole("link", { name: /^compare$/i })).toHaveAttribute(
      "href",
      "/store/compare",
    );
  });
});

test.describe("store product detail", () => {
  test("renders product detail page for a known slug", async ({ page }) => {
    await page.goto("/store/password-security-checkup");
    await expect(page.locator("html")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /password security checkup/i }),
    ).toBeVisible();
  });

  test("shows not found for unknown product slug", async ({ page }) => {
    const response = await page.goto("/store/unknown-product", {
      waitUntil: "networkidle",
    });
    await expect(
      page.getByText(/not found/i).or(page.locator("[data-testid='not-found']")),
    ).toBeVisible();
    expect(response?.status()).toBe(404);
  });
});

test.describe("service finder quiz", () => {
  test("loads quiz with questions and start state", async ({ page }) => {
    await page.goto("/store/quiz");
    await expect(page.locator("html")).toBeVisible();
    await expect(page.getByText(/service finder/i).first()).toBeVisible();
  });
});

test.describe("quote builder", () => {
  test("loads quote builder and validates required fields", async ({ page }) => {
    await page.goto("/store/quote");
    await expect(page.getByRole("heading", { name: /build your quote/i })).toBeVisible();
    await page.getByRole("button", { name: /^add$/i }).first().click();
    await page.getByRole("button", { name: /submit quote request/i }).click();
    await expect(page.getByText(/name, email, and phone are required/i)).toBeVisible();
  });
});
