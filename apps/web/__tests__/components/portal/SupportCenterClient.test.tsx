import { render, screen, within } from "@testing-library/react";
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

describe("SupportCenterClient", () => {
  let SupportCenterClient: typeof import("@/components/portal/SupportCenterClient").default;
  const mockCreateTicketAction = jest.fn();

  beforeAll(async () => {
    SupportCenterClient = (await import("@/components/portal/SupportCenterClient")).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const tickets = [
    {
      id: "ticket-1",
      subject: "Network Issue",
      description: "Cannot connect to VPN",
      status: "new",
      priority: "high",
      category: "Networking",
      updated_at: new Date().toISOString(),
    },
    {
      id: "ticket-2",
      subject: "Billing Question",
      description: "Invoice for last month",
      status: "closed",
      priority: "low",
      category: "Billing",
      updated_at: new Date().toISOString(),
    },
  ];

  it("renders heading and description", () => {
    render(<SupportCenterClient tickets={[]} createTicketAction={mockCreateTicketAction} />);
    expect(screen.getByRole("heading", { name: "Support" })).toBeInTheDocument();
    expect(screen.getByText(/Open and track support requests/)).toBeInTheDocument();
  });

  it("renders stat cards with zero values when no tickets", () => {
    render(<SupportCenterClient tickets={[]} createTicketAction={mockCreateTicketAction} />);
    expect(screen.getByText("Open Tickets")).toBeInTheDocument();
    expect(screen.getByText("Closed Tickets")).toBeInTheDocument();
    expect(screen.getByText("All Tickets")).toBeInTheDocument();
  });

  it("renders open tickets list", () => {
    render(<SupportCenterClient tickets={tickets} createTicketAction={mockCreateTicketAction} />);
    expect(screen.getByText("Network Issue")).toBeInTheDocument();
    expect(screen.getByText("Cannot connect to VPN")).toBeInTheDocument();
  });

  it("renders closed tickets in history section", async () => {
    const user = userEvent.setup();
    render(<SupportCenterClient tickets={tickets} createTicketAction={mockCreateTicketAction} />);
    await user.click(screen.getByText("Show History"));
    expect(screen.getByText("Billing Question")).toBeInTheDocument();
  });

  it("shows submit ticket button", () => {
    render(<SupportCenterClient tickets={[]} createTicketAction={mockCreateTicketAction} />);
    expect(screen.getByRole("button", { name: "Submit Ticket" })).toBeInTheDocument();
  });

  it("opens modal on submit ticket click", async () => {
    const user = userEvent.setup();
    render(<SupportCenterClient tickets={[]} createTicketAction={mockCreateTicketAction} />);
    await user.click(screen.getByText("Submit Ticket"));
    expect(screen.getByText("Create Support Ticket")).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("max-h-[90vh]");
    expect(dialog.className).toContain("overflow-y-auto");
    expect(dialog.className).toContain("w-[calc(100vw-2rem)]");
  });

  it("closes modal on cancel", async () => {
    const user = userEvent.setup();
    render(<SupportCenterClient tickets={[]} createTicketAction={mockCreateTicketAction} />);
    await user.click(screen.getByText("Submit Ticket"));
    await user.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Create Support Ticket")).not.toBeInTheDocument();
  });

  it("confirms a created ticket with a link (USE-P3-001)", async () => {
    mockCreateTicketAction.mockResolvedValue({
      ok: true,
      ticketId: "ticket-9",
      subject: "VPN is down",
    });
    const user = userEvent.setup();
    render(<SupportCenterClient tickets={[]} createTicketAction={mockCreateTicketAction} />);

    await user.click(screen.getByText("Submit Ticket"));
    await user.type(screen.getByLabelText("Title"), "VPN is down");
    await user.type(screen.getByLabelText("Description"), "Cannot reach the office VPN.");
    // The page's trigger button shares the label; submit inside the dialog.
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Submit Ticket" }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("VPN is down");
    const link = screen.getByRole("link", { name: "View ticket" });
    expect(link).toHaveAttribute("href", "/portal/support/ticket-9");
    // The modal closes once the submission is confirmed.
    expect(screen.queryByText("Create Support Ticket")).not.toBeInTheDocument();
  });

  it("opens the create form directly from the dashboard deep link", () => {
    render(
      <SupportCenterClient
        tickets={[]}
        createTicketAction={mockCreateTicketAction}
        initialCreateOpen
      />,
    );
    expect(screen.getByText("Create Support Ticket")).toBeInTheDocument();
  });

  it("renders ticket links to detail page", () => {
    render(<SupportCenterClient tickets={tickets} createTicketAction={mockCreateTicketAction} />);
    const link = screen.getByText("Network Issue").closest("a");
    expect(link).toHaveAttribute("href", "/portal/support/ticket-1");
  });

  it("uses server totals for the stat cards and pages with links (USE-P2-002)", () => {
    render(
      <SupportCenterClient
        tickets={tickets}
        createTicketAction={mockCreateTicketAction}
        page={1}
        pageSize={25}
        total={60}
        counts={{ open: 30, closed: 30, all: 60 }}
      />,
    );

    // All Tickets reflects the API total, not the two fetched rows.
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getAllByText("30").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Showing 1.2 of 60 tickets/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/portal/support?page=2",
    );
    expect(screen.queryByRole("link", { name: "Previous" })).not.toBeInTheDocument();
  });
});
