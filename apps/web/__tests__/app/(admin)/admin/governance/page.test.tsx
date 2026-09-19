import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockChangesList = jest.fn();
const mockRisksList = jest.fn();
const mockRetentionList = jest.fn();
const mockTabletopList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    governance: {
      changes: { list: mockChangesList },
      risks: { list: mockRisksList },
      retention: { list: mockRetentionList },
      tabletop: { list: mockTabletopList },
    },
  }),
}));

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mocks.requireAdminAccess(...args),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

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

describe("AdminGovernancePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockChangesList.mockResolvedValue({ items: [] });
    mockRisksList.mockResolvedValue({ items: [] });
    mockRetentionList.mockResolvedValue({ items: [] });
    mockTabletopList.mockResolvedValue({ items: [] });
  });

  it("renders page shell with title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Governance & Compliance Center" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Change advisory, risk register/)).toBeInTheDocument();
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("governance");
  });

  it("shows empty state text for all sections", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/page")).default;
    render(await Page());
    expect(screen.getByText("No change requests yet.")).toBeInTheDocument();
    expect(screen.getByText("No risks registered yet.")).toBeInTheDocument();
    expect(screen.getByText("No retention policies yet.")).toBeInTheDocument();
    expect(screen.getByText("No exercises planned yet.")).toBeInTheDocument();
  });

  it("renders section headings with counts", async () => {
    mockChangesList.mockResolvedValue({
      items: [
        { id: "c1", title: "CR-1", change_type: "standard", risk_level: "medium", status: "open" },
      ],
    });
    mockRisksList.mockResolvedValue({
      items: [
        {
          id: "r1",
          risk_description: "Risk 1",
          risk_category: "cyber",
          status: "active",
          risk_score: 7,
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/governance/page")).default;
    render(await Page());
    expect(screen.getByText(/Change Requests \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Risk Register \(1\)/)).toBeInTheDocument();
  });

  it("has action buttons linking to sub-pages", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/page")).default;
    render(await Page());
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/admin/governance/change-requests")).toBe(
      true,
    );
    expect(links.some((l) => l.getAttribute("href") === "/admin/governance/risks")).toBe(true);
  });
});
