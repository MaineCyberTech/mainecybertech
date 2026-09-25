import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockNetworkDiagramsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    networkDiagrams: { list: mockNetworkDiagramsList },
  }),
}));

jest.mock("@/lib/module-actions", () => ({
  createNetworkDiagram: jest.fn(),
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

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("NetworkDiagramsPage (admin)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockNetworkDiagramsList.mockResolvedValue({ items: [], total: 0 });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/network-diagrams/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("heading", { name: "Network Diagram" })).toBeInTheDocument();
    expect(screen.getByText(/Topology planning with a structured/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/network-diagrams/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("field-services");
  });

  it("renders CrudForm for new network diagram", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/network-diagrams/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("crudform")).toHaveTextContent("New Network Diagram");
  });

  it("renders empty state when no diagrams", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/network-diagrams/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("No network diagrams")).toBeInTheDocument();
  });

  it("renders diagrams with node/edge counts", async () => {
    mockNetworkDiagramsList.mockResolvedValue({
      items: [
        {
          id: "d1",
          name: "Main Office",
          description: "HQ topology",
          diagram: {
            nodes: [{ id: "n1", label: "Router" }, { id: "n2", label: "Switch" }],
            edges: [{ from: "n1", to: "n2" }],
          },
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
      total: 1,
    });
    const Page = (await import("@/app/(admin)/admin/field-services/network-diagrams/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Main Office")).toBeInTheDocument();
    expect(screen.getByText(/HQ topology/)).toBeInTheDocument();
    expect(screen.getByText(/Nodes: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Edges: 1/)).toBeInTheDocument();
    expect(screen.getByText("Router")).toBeInTheDocument();
    expect(screen.getByText("Switch")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/network-diagrams/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockNetworkDiagramsList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/field-services/network-diagrams/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("No network diagrams")).toBeInTheDocument();
  });
});
