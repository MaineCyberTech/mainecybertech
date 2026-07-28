import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({ push: mockPush }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    auth: { resetPassword: jest.fn() },
  }),
}));

jest.mock("@mct/ui/components/Button", () => ({
  __esModule: true,
  Button: ({ children, ...props }: Record<string, unknown>) =>
    React.createElement("button", props, children as React.ReactNode),
}));

describe("PasswordResetPage", () => {
  it("renders heading", () => {
    const { default: Page } = require("@/app/(public)/password-reset/page");
    render(React.createElement(Page));

    expect(screen.getByRole("heading", { name: /set new password/i })).toBeInTheDocument();
  });

  it("renders email input", () => {
    const { default: Page } = require("@/app/(public)/password-reset/page");
    render(React.createElement(Page));

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("name@clientdomain.com")).toBeInTheDocument();
  });

  it("renders password input", () => {
    const { default: Page } = require("@/app/(public)/password-reset/page");
    render(React.createElement(Page));

    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    const { default: Page } = require("@/app/(public)/password-reset/page");
    render(React.createElement(Page));

    expect(screen.getByRole("button", { name: /reset password/i })).toBeInTheDocument();
  });

  it("renders back to login link", () => {
    const { default: Page } = require("@/app/(public)/password-reset/page");
    render(React.createElement(Page));

    expect(screen.getByText("Back to Login")).toBeInTheDocument();
  });
});
