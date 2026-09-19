import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    auth: { forgotPassword: jest.fn() },
  }),
}));

jest.mock("@mct/ui/components/Button", () => ({
  __esModule: true,
  Button: ({ children, ...props }: Record<string, unknown>) =>
    React.createElement("button", props, children as React.ReactNode),
}));

describe("ForgotPasswordPage", () => {
  it("renders heading", () => {
    const { default: Page } = require("@/app/(public)/forgot-password/page");
    render(React.createElement(Page));

    expect(screen.getByRole("heading", { name: /reset password/i })).toBeInTheDocument();
  });

  it("renders email input", () => {
    const { default: Page } = require("@/app/(public)/forgot-password/page");
    render(React.createElement(Page));

    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("name@clientdomain.com")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    const { default: Page } = require("@/app/(public)/forgot-password/page");
    render(React.createElement(Page));

    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("renders back to login link", () => {
    const { default: Page } = require("@/app/(public)/forgot-password/page");
    render(React.createElement(Page));

    expect(screen.getByText("Back to Login")).toBeInTheDocument();
  });
});
