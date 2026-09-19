import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockGetApprovedMembership = jest
  .fn()
  .mockResolvedValue({ organization_id: "org-1" });
const mockNetworkDiagramsList = jest.fn();

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    networkDiagrams: { list: mockNetworkDiagramsList },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("@/components/Breadcrumbs", () => {
  return function MockBreadcrumbs({ items }: any) {
    return <nav data-testid="breadcrumbs">{items.length} items</nav>;
  };
});

describe("PortalNetworkDiagramsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
    mockNetworkDiagramsList.mockResolvedValue({ items: [], total: 0 });
  });

  it("renders page title", async () => {
    const Page = (await import("@/app/(portal)/portal/network-diagrams/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("heading", { name: "Network Diagrams" })).toBeInTheDocument();
  });

  it("renders empty state when no diagrams", async () => {
    const Page = (await import("@/app/(portal)/portal/network-diagrams/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("No network diagrams available.")).toBeInTheDocument();
  });

  it("renders diagrams with node/edge counts", async () => {
    mockNetworkDiagramsList.mockResolvedValue({
      items: [
        {
          id: "d1",
          name: "Branch Site",
          description: "Branch topology",
          diagram: {
            nodes: [{ id: "n1", label: "Firewall" }],
            edges: [],
          },
          created_at: "2026-02-01T00:00:00Z",
        },
      ],
      total: 1,
    });
    const Page = (await import("@/app/(portal)/portal/network-diagrams/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Branch Site")).toBeInTheDocument();
    expect(screen.getByText(/Nodes: 1/)).toBeInTheDocument();
    expect(screen.getByText("Firewall")).toBeInTheDocument();
  });

  it("handles API error gracefully", async () => {
    mockNetworkDiagramsList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(portal)/portal/network-diagrams/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("No network diagrams available.")).toBeInTheDocument();
  });
});
