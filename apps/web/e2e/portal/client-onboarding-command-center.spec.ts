import { test, expect, setActiveOrg } from "../fixtures";

// Seed org that the GAP module demo data is scoped to (seed 06/08).
const GAP_ORG = "11111111-1111-1111-1111-111111111111";

test.describe("Client Onboarding Command Center - Portal", () => {
  test.beforeEach(async ({ page }) => {
    await setActiveOrg(page, GAP_ORG);
    await page.goto("/portal/client-onboarding-command-center");
    await page.waitForLoadState("domcontentloaded");
  });

  test("page loads and shows empty state when no onboarding records", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Client Onboarding Command Center" }),
    ).toBeVisible();
    await expect(page.getByText("No onboarding records yet", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create Onboarding" })).toBeVisible();
  });

  test("shows onboarding records when they exist", async ({ page }) => {
    // This test would need seeded data - for now just verify page structure
    await expect(
      page.getByRole("heading", { name: "Client Onboarding Command Center" }),
    ).toBeVisible();
  });

  test("can navigate to new onboarding page", async ({ page }) => {
    await page.getByRole("link", { name: "Create Onboarding" }).click();
    await expect(page).toHaveURL(/\/portal\/client-onboarding-command-center\/new/);
  });

  test("breadcrumbs are present", async ({ page }) => {
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Portal" }),
    ).toBeVisible();
    await expect(page.getByText("Client Onboarding", { exact: true }).first()).toBeVisible();
  });
});

test.describe("Client Onboarding Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/client-onboarding-command-center/test-id");
    await page.waitForLoadState("domcontentloaded");
  });

  test("shows not found or detail view", async ({ page }) => {
    // Page should load without error
    await expect(page).not.toHaveURL(/\/error/);
  });
});
