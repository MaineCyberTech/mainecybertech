import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("PortalBreadcrumbs", () => {
  let PortalBreadcrumbs: typeof import("@/components/portal/PortalBreadcrumbs").default;

  beforeAll(async () => {
    PortalBreadcrumbs = (await import("@/components/portal/PortalBreadcrumbs")).default;
  });

  it("renders breadcrumb items with links for non-last items", () => {
    render(
      <PortalBreadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Support", href: "/portal/support" },
          { label: "Details" },
        ]}
      />,
    );

    const portalLink = screen.getByText("Portal");
    expect(portalLink.closest("a")).toHaveAttribute("href", "/portal/dashboard");

    const supportLink = screen.getByText("Support");
    expect(supportLink.closest("a")).toHaveAttribute("href", "/portal/support");
  });

  it("renders last item as non-link text", () => {
    render(
      <PortalBreadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Details" },
        ]}
      />,
    );

    const detailsItem = screen.getByText("Details");
    expect(detailsItem.closest("a")).toBeNull();
  });

  it("renders single item without separator", () => {
    const { container } = render(<PortalBreadcrumbs items={[{ label: "Home" }]} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(container.querySelectorAll("span.text-slate-600")).toHaveLength(0);
  });

  it("renders separators between items", () => {
    const { container } = render(
      <PortalBreadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Support", href: "/portal/support" },
        ]}
      />,
    );
    const separators = container.querySelectorAll("span.text-slate-600");
    expect(separators).toHaveLength(1);
    expect(separators[0]).toHaveTextContent("/");
  });

  it("renders last item with lighter text color", () => {
    render(
      <PortalBreadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Active" },
        ]}
      />,
    );
    const activeItem = screen.getByText("Active");
    expect(activeItem).toHaveClass("text-slate-200");
  });

  it("has aria-label for navigation", () => {
    render(<PortalBreadcrumbs items={[{ label: "Home" }]} />);
    expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
  });

  it("renders item without href as span", () => {
    render(<PortalBreadcrumbs items={[{ label: "Standalone" }]} />);
    const item = screen.getByText("Standalone");
    expect(item.tagName).toBe("SPAN");
  });
});
