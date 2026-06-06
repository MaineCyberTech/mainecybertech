import { test as base, expect, type Page } from "@playwright/test";

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

export const test = base;
export { expect };
