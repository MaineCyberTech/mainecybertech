import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

jest.mock("@/lib/module-actions", () => ({}));

const mockList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    eduAutomation: { compliance: { list: mockList } },
  }),
}));

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

describe("CompliancePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/compliance/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Compliance Readiness" })).toBeInTheDocument();
    expect(screen.getByText(/Framework-aligned controls/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/compliance/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("edu-automation");
  });

  it("renders empty state when no items", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/compliance/page")).default;
    render(await Page());
    expect(screen.getByText("No compliance records")).toBeInTheDocument();
  });

  it("renders items list when items exist", async () => {
    mockList.mockResolvedValue({
      items: [
        { id: "c1", framework: "SOC 2" },
        { id: "c2", framework: "ISO 27001" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/edu-automation/compliance/page")).default;
    render(await Page());
    expect(screen.getByText("SOC 2")).toBeInTheDocument();
    expect(screen.getByText("ISO 27001")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/compliance/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/edu-automation/compliance/page")).default;
    render(await Page());
    expect(screen.getByText("No compliance records")).toBeInTheDocument();
  });
});
