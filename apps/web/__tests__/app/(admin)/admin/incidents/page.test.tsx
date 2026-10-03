import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockIncidentsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    securitySuite: { incidents: { list: mockIncidentsList } },
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
  createIncident: jest.fn(),
}));

describe("AdminIncidentsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockIncidentsList.mockResolvedValue({ items: [] });
  });

  it("renders page shell with title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/incidents/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Security Incident Response" })).toBeInTheDocument();
    expect(screen.getByText(/Track incidents from detection/)).toBeInTheDocument();
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/incidents/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("incidents");
  });

  it("shows empty state when no incidents", async () => {
    const Page = (await import("@/app/(admin)/admin/incidents/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No incidents")).toBeInTheDocument();
  });

  it("renders crud form for new incident", async () => {
    const Page = (await import("@/app/(admin)/admin/incidents/page")).default;
    render(await Page());
    expect(screen.getByTestId("crud-form")).toHaveTextContent("New Incident");
  });

  it("renders incident items with title and severity", async () => {
    mockIncidentsList.mockResolvedValue({
      items: [
        {
          id: "i1",
          title: "Phishing Attack",
          incident_type: "phishing",
          severity: "high",
          status: "open",
          detected_at: "2026-01-15T00:00:00Z",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/incidents/page")).default;
    render(await Page());
    expect(screen.getByText("Phishing Attack")).toBeInTheDocument();
    expect(screen.getByText("open")).toBeInTheDocument();
  });
});
