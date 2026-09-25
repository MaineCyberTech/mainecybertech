import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

jest.mock("@/lib/module-actions", () => ({}));

const mockList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    eduAutomation: { automation: { list: mockList } },
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

describe("AutomationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/automation/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Automation Workflow" })).toBeInTheDocument();
    expect(screen.getByText(/Script and trigger-based automation workflows/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/automation/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("edu-automation");
  });

  it("renders empty state when no items", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/automation/page")).default;
    render(await Page());
    expect(screen.getByText("No automation workflows")).toBeInTheDocument();
  });

  it("renders items list when items exist", async () => {
    mockList.mockResolvedValue({
      items: [
        { id: "w1", name: "User Onboarding" },
        { id: "w2", name: "Domain Provisioning" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/edu-automation/automation/page")).default;
    render(await Page());
    expect(screen.getByText("User Onboarding")).toBeInTheDocument();
    expect(screen.getByText("Domain Provisioning")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/automation/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/edu-automation/automation/page")).default;
    render(await Page());
    expect(screen.getByText("No automation workflows")).toBeInTheDocument();
  });
});
