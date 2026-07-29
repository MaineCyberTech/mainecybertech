import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockDmarcList = jest.fn();
jest.mock("@/lib/api", () => () => ({
  batch: { dmarc: { list: mockDmarcList } },
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

describe("DmarcPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockDmarcList.mockResolvedValue({ items: [] });
  });

  it("renders page title", async () => {
    const Page = (await import("@/app/(admin)/admin/dmarc/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: /email deliverability dmarc coach/i }),
    ).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/dmarc/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("dmarc");
  });

  it("shows empty state when no data", async () => {
    const Page = (await import("@/app/(admin)/admin/dmarc/page")).default;
    render(await Page());
    expect(screen.getByText(/no dmarc assessments/i)).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockDmarcList.mockResolvedValue({
      items: [
        {
          id: "1",
          domain: "example.com",
          spf_valid: true,
          dkim_configured: false,
          dmarc_valid: true,
          dmarc_policy: "reject",
          status: "active",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/dmarc/page")).default;
    render(await Page());
    expect(screen.getByText("example.com")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/dmarc/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockDmarcList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/dmarc/page")).default;
    render(await Page());
    expect(screen.getByText(/no dmarc assessments/i)).toBeInTheDocument();
  });
});
