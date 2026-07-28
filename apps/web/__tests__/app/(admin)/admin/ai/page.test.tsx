import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockTriageList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    ai: { triageList: mockTriageList },
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

describe("AdminAiToolsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockTriageList.mockResolvedValue({ items: [] });
  });

  it("renders page shell with title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/ai/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "AI Service Desk Tools" })).toBeInTheDocument();
    expect(screen.getByText(/Ticket triage assistant/)).toBeInTheDocument();
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/ai/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("ai");
  });

  it("shows empty state when no triage drafts", async () => {
    const Page = (await import("@/app/(admin)/admin/ai/page")).default;
    render(await Page());
    const emptyStates = screen.getAllByTestId("empty-state");
    expect(emptyStates.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("No triage drafts yet")).toBeInTheDocument();
  });

  it("renders feature cards with links", async () => {
    const Page = (await import("@/app/(admin)/admin/ai/page")).default;
    render(await Page());
    expect(screen.getByText("Ticket Triage")).toBeInTheDocument();
    expect(screen.getByText("Copilot Console")).toBeInTheDocument();
  });

  it("has action buttons linking to triage and tickets", async () => {
    const Page = (await import("@/app/(admin)/admin/ai/page")).default;
    render(await Page());
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/admin/ai/triage")).toBe(true);
    expect(links.some((l) => l.getAttribute("href") === "/admin/tickets")).toBe(true);
  });

  it("renders triage draft items with description", async () => {
    mockTriageList.mockResolvedValue({
      items: [
        {
          id: "d1",
          raw_description: "Client cannot access email",
          suggested_category: "email",
          suggested_priority: "high",
          suggested_subject: "Email issue",
          confidence_score: 92,
          status: "pending",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/ai/page")).default;
    render(await Page());
    expect(screen.getByText("Client cannot access email")).toBeInTheDocument();
  });
});
