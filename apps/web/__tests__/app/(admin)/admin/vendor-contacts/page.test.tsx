import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockContactsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    vendors: { contacts: { list: mockContactsList } },
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

jest.mock("@/components/EmptyState", () => {
  return function MockEmptyState({ title, description }: any) {
    return (
      <div data-testid="empty-state">
        <p>{title}</p>
        <p>{description}</p>
      </div>
    );
  };
});

jest.mock("@/components/admin/CrudForm", () => {
  return function MockCrudForm({ title }: any) {
    return <div data-testid="crud-form">{title}</div>;
  };
});

jest.mock("@/lib/module-actions", () => ({
  createVendorContact: jest.fn(),
}));

describe("AdminVendorContactsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockContactsList.mockResolvedValue({ items: [] });
  });

  it("renders page shell with title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contacts/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Vendor Contact Escalation Directory" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Centralized vendor contacts/)).toBeInTheDocument();
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contacts/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("vendor-contacts");
  });

  it("shows empty state when no contacts", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contacts/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No vendor contacts")).toBeInTheDocument();
  });

  it("renders crud form for new contact", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contacts/page")).default;
    render(await Page());
    expect(screen.getByTestId("crud-form")).toHaveTextContent("New Vendor Contact");
  });

  it("renders contact items with name and vendor", async () => {
    mockContactsList.mockResolvedValue({
      items: [
        {
          id: "c1",
          vendor_name: "Acme",
          contact_name: "John Doe",
          role_title: "Support Manager",
          email: "john@acme.com",
          phone: "555-0100",
          is_primary: true,
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/vendor-contacts/page")).default;
    render(await Page());
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText(/Acme/)).toBeInTheDocument();
  });

  it("links each contact to its detail page", async () => {
    mockContactsList.mockResolvedValue({
      items: [
        {
          id: "vc-1",
          vendor_name: "TestCo",
          contact_name: "Jane",
          role_title: "Engineer",
          email: "j@test.com",
          phone: "555-0001",
          is_primary: false,
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/vendor-contacts/page")).default;
    render(await Page());
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/admin/vendor-contacts/vc-1")).toBe(true);
  });
});
