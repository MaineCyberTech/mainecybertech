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

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: jest.fn().mockResolvedValue({ userId: "u1", roleKey: "admin" }),
}));

describe("EduAutomationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Education & Automation Center" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/SOPs, compliance/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("edu-automation");
  });

  it("renders all section headings", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/page")).default;
    render(await Page());
    expect(screen.getByText("Governance")).toBeInTheDocument();
    expect(screen.getByText("Client Education")).toBeInTheDocument();
    expect(screen.getByText("Automation & AI")).toBeInTheDocument();
  });

  it("renders navigation links for each item", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/page")).default;
    render(await Page());
    expect(screen.getAllByRole("link", { name: "SOP Library" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: "Knowledge Base" }).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getAllByRole("link", { name: "Phishing Sim" }).length).toBeGreaterThanOrEqual(1);
  });

  it("links point to correct paths", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/page")).default;
    render(await Page());
    const link = screen.getAllByRole("link", { name: "SOP Library" })[0];
    expect(link).toHaveAttribute("href", "/admin/edu-automation/sop");
  });
});
