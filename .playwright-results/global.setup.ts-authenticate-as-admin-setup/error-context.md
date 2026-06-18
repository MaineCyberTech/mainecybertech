# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: global.setup.ts >> authenticate as admin
- Location: e2e\global.setup.ts:6:6

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/dashboard|\/admin/
Received string:  "http://localhost:3000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:3000/login"

```

```yaml
- banner:
    - link "Maine CyberTech":
        - /url: /
    - navigation:
        - link "Home":
            - /url: /
        - link "Networks":
            - /url: /services/networks
        - link "Security Systems":
            - /url: /services/security-systems
        - link "IT Support":
            - /url: /services/it-support
        - link "Cloud":
            - /url: /services/cloud
        - link "Cybersecurity":
            - /url: /services/cybersecurity
        - link "Contact Us":
            - /url: /contact
        - link "Portal":
            - /url: /login
- main:
    - main:
        - heading "Secure Login" [level=1]
        - paragraph: Sign in to access your Maine CyberTech client portal.
        - text: Work Email
        - textbox "name@clientdomain.com": superadmin.real@mainecybertech.local
        - text: Password
        - textbox "••••••••••": "1"
        - link "Forgot password?":
            - /url: /forgot-password
        - text: An unexpected error occurred
        - button "Secure Login"
        - paragraph:
            - text: Need an account?
            - link "Sign up":
                - /url: /signup
- alert
```

# Test source

```ts
  1  | import { test as setup, expect } from "@playwright/test";
  2  |
  3  | const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "superadmin.real@mainecybertech.local";
  4  | const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "1";
  5  |
  6  | setup("authenticate as admin", async ({ page }) => {
  7  |   await page.goto("/login");
  8  |   await page.getByPlaceholder("name@clientdomain.com").fill(ADMIN_EMAIL);
  9  |   await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  10 |   await page.getByRole("button", { name: /secure login/i }).click();
> 11 |   await expect(page).toHaveURL(/\/dashboard|\/admin/);
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  12 |   await page.context().storageState({ path: ".playwright-auth.json" });
  13 | });
  14 |
```
