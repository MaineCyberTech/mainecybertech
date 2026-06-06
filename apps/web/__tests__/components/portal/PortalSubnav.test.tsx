import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

describe("PortalSubnav", () => {
  it("renders all navigation items", async () => {
    const { default: PortalSubnav } = await import(
      "@/components/portal/PortalSubnav"
    );

    render(<PortalSubnav current="dashboard" />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
    expect(screen.getByText("Billing")).toBeInTheDocument();
  });

  it("sets correct href on each link", async () => {
    const { default: PortalSubnav } = await import(
      "@/components/portal/PortalSubnav"
    );

    render(<PortalSubnav current="dashboard" />);

    expect(screen.getByText("Dashboard").closest("a")).toHaveAttribute(
      "href",
      "/portal/dashboard",
    );
    expect(screen.getByText("Projects").closest("a")).toHaveAttribute(
      "href",
      "/portal/projects",
    );
  });

  it("highlights the current nav item", async () => {
    const { default: PortalSubnav } = await import(
      "@/components/portal/PortalSubnav"
    );

    render(<PortalSubnav current="support" />);

    const supportLink = screen.getByText("Support").closest("a");
    expect(supportLink!.className).toContain("bg-emerald-600/10");

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink!.className).not.toContain("bg-emerald-600/10");
  });
});
