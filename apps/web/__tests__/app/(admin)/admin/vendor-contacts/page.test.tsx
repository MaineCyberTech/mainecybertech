import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockVendorContactsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    vendors: { contacts: { list: mockVendorContactsList } },
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

describe("VendorContactsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockVendorContactsList.mockResolvedValue({ items: [] });
  });

  it("renders page title", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contacts/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(
      screen.getByRole("heading", { name: /vendor contact escalation directory/i }),
    ).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contacts/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("vendor-contacts");
  });

  it("shows empty state when no data", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contacts/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/no vendor contacts/i)).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockVendorContactsList.mockResolvedValue({
      items: [
        {
          id: "1",
          vendor_name: "Acme Corp",
          contact_name: "John Doe",
          role_title: "AM",
          email: "john@acme.com",
          phone: "555-0100",
          is_primary: true,
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/vendor-contacts/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contacts/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockVendorContactsList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/vendor-contacts/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/no vendor contacts/i)).toBeInTheDocument();
  });
});
