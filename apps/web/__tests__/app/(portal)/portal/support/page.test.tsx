import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockTicketsList = jest.fn();
const mockUsersMe = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    tickets: { list: mockTicketsList },
    users: { me: mockUsersMe },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  usePathname: () => "/portal/support",
}));

jest.mock("@/components/portal/PortalSubnav", () => ({
  __esModule: true,
  default: () => React.createElement("nav", null),
}));

jest.mock("@/components/portal/SupportCenterClient", () => {
  return {
    __esModule: true,
    default: ({ tickets, page, total }: { tickets: any[]; page?: number; total?: number }) => (
      <div data-testid="support-center" data-page={page ?? 1} data-total={total ?? tickets.length}>
        {tickets.length > 0 ? (
          tickets.map((t: any) => <div key={t.id}>{t.subject ?? t.title}</div>)
        ) : (
          <div>No tickets</div>
        )}
      </div>
    ),
  };
});

const defaultProps = { searchParams: Promise.resolve({}) };

describe("PortalSupportPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
    mockUsersMe.mockResolvedValue({ userId: "user-1" });
  });

  it("renders support center with tickets when data exists", async () => {
    mockTicketsList.mockResolvedValue({
      items: [
        { id: "t1", subject: "Login Issue", status: "new" },
        { id: "t2", subject: "Password Reset", status: "open" },
      ],
    });

    const { default: PortalSupportPage } = await import("@/app/(portal)/portal/support/page");
    const element = await PortalSupportPage(defaultProps);
    render(element);

    expect(screen.getByText("Login Issue")).toBeInTheDocument();
    expect(screen.getByText("Password Reset")).toBeInTheDocument();
  });

  it("renders empty state when no tickets", async () => {
    mockTicketsList.mockResolvedValue({ items: [] });

    const { default: PortalSupportPage } = await import("@/app/(portal)/portal/support/page");
    const element = await PortalSupportPage(defaultProps);
    render(element);

    expect(screen.getByText("No tickets")).toBeInTheDocument();
  });

  it("throws when no org membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: PortalSupportPage } = await import("@/app/(portal)/portal/support/page");
    await expect(PortalSupportPage(defaultProps)).rejects.toThrow("No approved membership found.");
  });

  it("redirects when user not found", async () => {
    mockTicketsList.mockResolvedValue({ items: [] });
    mockUsersMe.mockResolvedValue(null);

    const { default: PortalSupportPage } = await import("@/app/(portal)/portal/support/page");
    const { redirect } = await import("next/navigation");
    await PortalSupportPage(defaultProps);
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("passes the requested page and API totals to the client (USE-P2-002)", async () => {
    mockTicketsList.mockResolvedValue({ items: [], total: 40 });

    const { default: PortalSupportPage } = await import("@/app/(portal)/portal/support/page");
    const element = await PortalSupportPage({
      searchParams: Promise.resolve({ page: "2" }),
    });
    render(element);

    const client = screen.getByTestId("support-center");
    expect(client).toHaveAttribute("data-page", "2");
    expect(client).toHaveAttribute("data-total", "40");
    expect(mockTicketsList).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 25, organizationId: "org-1" }),
    );
  });
});
