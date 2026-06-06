import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

describe("AdminSubnav", () => {
  it("renders all navigation items", async () => {
    const { default: AdminSubnav } = await import(
      "@/components/admin/AdminSubnav"
    );

    render(<AdminSubnav current="home" />);

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Approvals")).toBeInTheDocument();
    expect(screen.getByText("Organizations")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Tickets")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });

  it("sets correct href on each link", async () => {
    const { default: AdminSubnav } = await import(
      "@/components/admin/AdminSubnav"
    );

    render(<AdminSubnav current="home" />);

    expect(screen.getByText("Overview").closest("a")).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(screen.getByText("Approvals").closest("a")).toHaveAttribute(
      "href",
      "/admin/approvals",
    );
  });

  it("highlights the current nav item", async () => {
    const { default: AdminSubnav } = await import(
      "@/components/admin/AdminSubnav"
    );

    render(<AdminSubnav current="users" />);

    const userLink = screen.getByText("Users").closest("a");
    expect(userLink!.className).toContain("bg-emerald-600/10");

    const overviewLink = screen.getByText("Overview").closest("a");
    expect(overviewLink!.className).not.toContain("bg-emerald-600/10");
  });
});
