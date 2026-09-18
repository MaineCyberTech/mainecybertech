import { test as base, expect, type Page } from "@playwright/test";

export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export class LoginPage {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.getByPlaceholder("name@clientdomain.com").fill(email);
    await this.page.locator('input[type="password"]').fill(password);
    await this.page.getByRole("button", { name: /secure login/i }).click();
  }

  async expectSuccessfulLogin() {
    await expect(this.page).toHaveURL(/\/dashboard|\/admin/);
  }

  async expectLoginError(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}

export class AdminPage {
  constructor(public readonly page: Page) {}

  async goto(section = "") {
    await this.page.goto(`/admin${section}`);
  }

  async expectHeading(name: string) {
    await expect(this.page.getByRole("heading", { name })).toBeVisible();
  }
}

/**
 * Switch the active tenant for the session. The API resolves the
 * default org from the first approved membership when no cookie is
 * present, which is non-deterministic once migrations seed extra
 * memberships — so specs that depend on a specific tenant's data
 * should pin the org explicitly.
 */
export async function setActiveOrg(page: Page, organizationId: string) {
  // Set the active-org cookie directly on the context. Navigating to /login
  // first is unnecessary (and the middleware would just redirect an
  // authenticated session to /portal/dashboard), so we avoid that dance.
  await page.context().addCookies([
    {
      name: "mct_active_org",
      value: organizationId,
      url: BASE_URL,
    },
  ]);
}

/**
 * Navigate to an app route and, for authenticated routes, wait for the
 * server-rendered shell to paint.
 *
 * The admin/portal layouts `throw` when the profile fetch fails with a
 * transient 5xx/429, so the error boundary renders instead of the header
 * and downstream locators (e.g. the notification bell) time out with no
 * useful signal. Waiting on the shell here gives a deterministic failure
 * point and absorbs ordinary hydration latency.
 */
export async function gotoApp(
  page: Page,
  path: string,
  opts: { shell?: boolean } = {},
): Promise<void> {
  const { shell = true } = opts;
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
  if (shell) {
    await expect(page.locator("header").first()).toBeVisible({ timeout: 20_000 });
  }
}

export const test = base;
export { expect };
