import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const mockOrgsList = jest.fn();
const mockTicketsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    organizations: { list: mockOrgsList },
    tickets: { list: mockTicketsList },
  }),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock("@/components/admin/AdminBreadcrumbs", () => {
  return function MockBreadcrumbs({ items }: any) {
    return <nav data-testid="breadcrumbs">{items.length} items</nav>;
  };
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: any) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

jest.mock("@/components/admin/AdminTicketCenterClient", () => {
  return function MockTicketCenterClient({ tickets, organizations, createTicketAction }: any) {
    return (
      <div data-testid="ticket-center-client">
        <span data-testid="ticket-count">{tickets.length}</span>
        <span data-testid="org-count">{organizations.length}</span>
        <span data-testid="has-create-action">{typeof createTicketAction === "function" ? "yes" : "no"}</span>
      </div>
    );
  };
});

describe("AdminTicketsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockOrgsList.mockResolvedValue([{ id: "o1", name: "Acme Corp" }]);
    mockTicketsList.mockResolvedValue({ items: [{ id: "t1", subject: "Help request" }] });
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/tickets/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("tickets");
  });

  it("renders AdminTicketCenterClient with tickets", async () => {
    const Page = (await import("@/app/(admin)/admin/tickets/page")).default;
    render(await Page());
    expect(screen.getByTestId("ticket-center-client")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-count")).toHaveTextContent("1");
  });

  it("passes organizations to the client", async () => {
    mockOrgsList.mockResolvedValue([{ id: "o1", name: "Acme" }, { id: "o2", name: "Beta" }]);
    const Page = (await import("@/app/(admin)/admin/tickets/page")).default;
    render(await Page());
    expect(screen.getByTestId("org-count")).toHaveTextContent("2");
  });

  it("passes a createTicketAction function", async () => {
    const Page = (await import("@/app/(admin)/admin/tickets/page")).default;
    render(await Page());
    expect(screen.getByTestId("has-create-action")).toHaveTextContent("yes");
  });

  it("handles empty tickets", async () => {
    mockTicketsList.mockResolvedValue({ items: [] });
    const Page = (await import("@/app/(admin)/admin/tickets/page")).default;
    render(await Page());
    expect(screen.getByTestId("ticket-count")).toHaveTextContent("0");
  });
});
