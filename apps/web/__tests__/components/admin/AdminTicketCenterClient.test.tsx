import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("AdminTicketCenterClient", () => {
  let AdminTicketCenterClient: typeof import("@/components/admin/AdminTicketCenterClient").default;
  const mockCreateTicketAction = jest.fn();

  beforeAll(async () => {
    AdminTicketCenterClient = (await import("@/components/admin/AdminTicketCenterClient")).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const tickets = [
    {
      id: "t1",
      subject: "Network Outage",
      description: "Main switch down",
      status: "new",
      priority: "urgent",
      category: "Infrastructure",
      organization_id: "org-1",
      updated_at: new Date().toISOString(),
    },
    {
      id: "t2",
      subject: "Software Update",
      description: "Patch required",
      status: "closed",
      priority: "low",
      category: "Maintenance",
      organization_id: "org-2",
      updated_at: new Date().toISOString(),
    },
  ];

  const organizations = [
    { id: "org-1", name: "Acme Corp" },
    { id: "org-2", name: "Beta Inc" },
  ];

  it("renders heading and description", () => {
    render(
      <AdminTicketCenterClient
        tickets={[]}
        organizations={[]}
        createTicketAction={mockCreateTicketAction}
      />,
    );
    expect(screen.getAllByRole("heading", { name: "Tickets" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Create and manage support tickets/)).toBeInTheDocument();
  });

  it("renders stat cards", () => {
    render(
      <AdminTicketCenterClient
        tickets={tickets}
        organizations={organizations}
        createTicketAction={mockCreateTicketAction}
      />,
    );
    const statLabels = screen.getAllByText("Open Tickets");
    expect(statLabels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Closed Tickets").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("All Tickets").length).toBeGreaterThanOrEqual(1);
  });

  it("renders all tickets in unified list", () => {
    render(
      <AdminTicketCenterClient
        tickets={tickets}
        organizations={organizations}
        createTicketAction={mockCreateTicketAction}
      />,
    );
    expect(screen.getByText("Network Outage")).toBeInTheDocument();
    expect(screen.getByText("Software Update")).toBeInTheDocument();
  });

  it("displays organization name in ticket cards and filter", () => {
    render(
      <AdminTicketCenterClient
        tickets={tickets}
        organizations={organizations}
        createTicketAction={mockCreateTicketAction}
      />,
    );
    expect(screen.getAllByText(/Acme Corp/).length).toBeGreaterThanOrEqual(1);
  });

  it("filters tickets by search query", async () => {
    const user = userEvent.setup();
    render(
      <AdminTicketCenterClient
        tickets={tickets}
        organizations={organizations}
        createTicketAction={mockCreateTicketAction}
      />,
    );
    const searchInput = screen.getByPlaceholderText("Search tickets...");
    await user.type(searchInput, "Network");
    expect(screen.getByText("Network Outage")).toBeInTheDocument();
    expect(screen.queryByText("Software Update")).not.toBeInTheDocument();
  });

  it("filters tickets by status", async () => {
    const user = userEvent.setup();
    render(
      <AdminTicketCenterClient
        tickets={tickets}
        organizations={organizations}
        createTicketAction={mockCreateTicketAction}
      />,
    );
    const statusSelect = screen.getByDisplayValue("All status");
    await user.selectOptions(statusSelect, "closed");
    expect(screen.queryByText("Network Outage")).not.toBeInTheDocument();
    expect(screen.getByText("Software Update")).toBeInTheDocument();
  });

  it("shows create ticket modal on button click", async () => {
    const user = userEvent.setup();
    render(
      <AdminTicketCenterClient
        tickets={[]}
        organizations={organizations}
        createTicketAction={mockCreateTicketAction}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Create Ticket" }));
    expect(screen.getByRole("heading", { name: "Create Ticket" })).toBeInTheDocument();
  });

  it("renders ticket links with organization", () => {
    render(
      <AdminTicketCenterClient
        tickets={tickets}
        organizations={organizations}
        createTicketAction={mockCreateTicketAction}
      />,
    );
    const link = screen.getByText("Network Outage").closest("a");
    expect(link).toHaveAttribute("href", "/admin/tickets/t1");
  });
});
