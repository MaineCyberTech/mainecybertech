import { test, expect } from "../fixtures";

test.describe("marketing homepage", () => {
  test("renders hero section with heading and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /secure your future/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /get support now/i })).toBeVisible();
  });

  test("displays all 5 service cards", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("h3");
    await expect(cards.filter({ hasText: /business networks/i })).toBeVisible();
    await expect(cards.filter({ hasText: /security systems/i })).toBeVisible();
    await expect(cards.filter({ hasText: /technical it support/i })).toBeVisible();
    await expect(cards.filter({ hasText: /cloud configuration/i })).toBeVisible();
    await expect(cards.filter({ hasText: /security configuration/i })).toBeVisible();
  });

  test("service cards link to detail pages", async ({ page }) => {
    await page.goto("/");
    const networksLink = page.getByRole("link", { name: /business networks/i });
    await expect(networksLink).toHaveAttribute("href", "/services/networks");
  });

  test("Get Support Now CTA links to contact page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /get support now/i })).toHaveAttribute("href", "/contact");
  });
});

test.describe("service detail pages", () => {
  const slugs = ["networks", "security-systems", "it-support", "cloud", "cybersecurity"];

  for (const slug of slugs) {
    test(`renders ${slug} service page`, async ({ page }) => {
      await page.goto(`/services/${slug}`);
      await expect(page.locator("html")).toBeVisible();
      await expect(page.getByText(/back to home/i)).toBeVisible();
    });
  }

  test("shows 404 for unknown service slug", async ({ page }) => {
    const response = await page.goto("/services/unknown-service", { waitUntil: "networkidle" });
    await expect(page.getByText(/not found/i).or(page.locator("[data-testid='not-found']"))).toBeVisible();
  });
});
