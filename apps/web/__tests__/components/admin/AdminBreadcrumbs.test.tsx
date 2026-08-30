import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

describe("Breadcrumbs", () => {
  it("renders breadcrumb items with links", async () => {
    const { default: Breadcrumbs } = await import("@/components/Breadcrumbs");

    render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/admin" },
          { label: "Users", href: "/admin/users" },
          { label: "Details" },
        ]}
      />,
    );

    const homeLink = screen.getByText("Home");
    expect(homeLink.closest("a")).toHaveAttribute("href", "/admin");

    const usersLink = screen.getByText("Users");
    expect(usersLink.closest("a")).toHaveAttribute("href", "/admin/users");
  });

  it("renders last item as non-link text", async () => {
    const { default: Breadcrumbs } = await import("@/components/Breadcrumbs");

    render(<Breadcrumbs items={[{ label: "Home", href: "/admin" }, { label: "Current Page" }]} />);

    const currentPage = screen.getByText("Current Page");
    expect(currentPage.closest("a")).toBeNull();
  });

  it("shows separators between items", async () => {
    const { default: Breadcrumbs } = await import("@/components/Breadcrumbs");

    const { container } = render(
      <Breadcrumbs items={[{ label: "Home", href: "/admin" }, { label: "Users" }]} />,
    );

    const separators = container.querySelectorAll("li span");
    const slashItems = Array.from(separators).filter((el) => el.textContent === "/");
    expect(slashItems).toHaveLength(1);
  });

  it("renders single item without href", async () => {
    const { default: Breadcrumbs } = await import("@/components/Breadcrumbs");

    render(<Breadcrumbs items={[{ label: "Dashboard" }]} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Dashboard").closest("a")).toBeNull();
  });
});
