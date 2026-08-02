import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("ForbiddenPage", () => {
  it("renders 403 heading and copy", async () => {
    const Page = (await import("@/app/forbidden/page")).default;
    render(await Page());
    expect(screen.getByText("403")).toBeInTheDocument();
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
  });

  it("links to dashboard and login", async () => {
    const Page = (await import("@/app/forbidden/page")).default;
    render(await Page());
    const dashboardLink = screen.getByText("Go to Dashboard").closest("a");
    expect(dashboardLink).toHaveAttribute("href", "/portal/dashboard");
    const loginLink = screen.getByText("Sign In").closest("a");
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
