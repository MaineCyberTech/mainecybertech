import { render, screen } from "@testing-library/react";

jest.mock("@/components/Breadcrumbs", () => {
  return function MockBreadcrumbs({ items }: any) {
    return <nav data-testid="breadcrumbs">{items.length} items</nav>;
  };
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: any) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("FinalPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/final/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Additional Tools" })).toBeInTheDocument();
    expect(screen.getByText(/SharePoint planning/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/final/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("final");
  });

  it("renders all section headings", async () => {
    const Page = (await import("@/app/(admin)/admin/final/page")).default;
    render(await Page());
    expect(screen.getByText("M365 & Procurement")).toBeInTheDocument();
    expect(screen.getByText("Client Engagement")).toBeInTheDocument();
    expect(screen.getByText("Operations")).toBeInTheDocument();
  });

  it("renders navigation links for each item", async () => {
    const Page = (await import("@/app/(admin)/admin/final/page")).default;
    render(await Page());
    expect(
      screen.getAllByRole("link", { name: "SharePoint Planner" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: "SaaS Audit" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: "BDR" }).length).toBeGreaterThanOrEqual(1);
  });

  it("links point to correct paths", async () => {
    const Page = (await import("@/app/(admin)/admin/final/page")).default;
    render(await Page());
    const link = screen.getAllByRole("link", { name: "SharePoint Planner" })[0];
    expect(link).toHaveAttribute("href", "/admin/final/sharepoint");
  });
});
