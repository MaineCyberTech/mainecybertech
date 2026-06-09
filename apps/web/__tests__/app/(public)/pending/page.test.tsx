import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";

describe("PendingPage", () => {
  it("renders the approval pending heading", async () => {
    const { default: PendingPage } = await import(
      "@/app/(public)/pending/page"
    );
    render(<PendingPage />);

    expect(
      screen.getByRole("heading", { name: /approval pending/i }),
    ).toBeInTheDocument();
  });

  it("renders the email verification message", async () => {
    const { default: PendingPage } = await import(
      "@/app/(public)/pending/page"
    );
    render(<PendingPage />);

    expect(
      screen.getByText(/your email is verified/i),
    ).toBeInTheDocument();
  });

  it("renders sign out and return to login button", async () => {
    const { default: PendingPage } = await import(
      "@/app/(public)/pending/page"
    );
    render(<PendingPage />);

    const button = screen.getByRole("button", { name: /sign out.*return to login/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });
});
