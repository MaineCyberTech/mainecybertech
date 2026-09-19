import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockDeviceProfilesList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    deviceProfiles: { list: mockDeviceProfilesList },
  }),
}));

jest.mock("@/lib/module-actions", () => ({
  createDeviceProfile: jest.fn(),
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

jest.mock("@/components/admin/CrudForm", () => {
  return function MockCrudForm({ title }: any) {
    return <div data-testid="crudform">{title}</div>;
  };
});

jest.mock("@/components/admin/AdminPagination", () => {
  return function MockPagination() {
    return <nav data-testid="pagination" />;
  };
});

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("DeviceProfilesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockDeviceProfilesList.mockResolvedValue({ items: [], total: 0 });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/final/device-profiles/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("heading", { level: 1, name: "Device Profiles" })).toBeInTheDocument();
    expect(screen.getByText(/Standard device profiles/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/final/device-profiles/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("final");
  });

  it("renders CrudForm for new device profile", async () => {
    const Page = (await import("@/app/(admin)/admin/final/device-profiles/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("crudform")).toHaveTextContent("New Device Profile");
  });

  it("renders empty state when no profiles", async () => {
    const Page = (await import("@/app/(admin)/admin/final/device-profiles/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("No device profiles")).toBeInTheDocument();
  });

  it("renders profiles list when profiles exist", async () => {
    mockDeviceProfilesList.mockResolvedValue({
      items: [
        { id: "p1", name: "Clinical Workstation Standard", type: "workstation", manufacturer: "Dell", model: "OptiPlex 7020", created_at: "2026-01-01T00:00:00Z" },
      ],
      total: 1,
    });
    const Page = (await import("@/app/(admin)/admin/final/device-profiles/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Clinical Workstation Standard")).toBeInTheDocument();
    expect(screen.getByText(/Dell OptiPlex 7020/)).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/final/device-profiles/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockDeviceProfilesList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/final/device-profiles/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("No device profiles")).toBeInTheDocument();
  });
});
