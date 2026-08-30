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
}));

jest.mock("@/components/portal/SupportCenterClient", () => {
  return {
    __esModule: true,
    default: ({ tickets }: { tickets: any[] }) => (
      <div data-testid="support-center">
        {tickets.length > 0 ? (
          tickets.map((t: any) => <div key={t.id}>{t.subject ?? t.title}</div>)
        ) : (
          <div>No tickets</div>
        )}
      </div>
    ),
  };
});

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
    const element = await PortalSupportPage();
    render(element);

    expect(screen.getByText("Login Issue")).toBeInTheDocument();
    expect(screen.getByText("Password Reset")).toBeInTheDocument();
  });

  it("renders empty state when no tickets", async () => {
    mockTicketsList.mockResolvedValue({ items: [] });

    const { default: PortalSupportPage } = await import("@/app/(portal)/portal/support/page");
    const element = await PortalSupportPage();
    render(element);

    expect(screen.getByText("No tickets")).toBeInTheDocument();
  });

  it("throws when no org membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: PortalSupportPage } = await import("@/app/(portal)/portal/support/page");
    await expect(PortalSupportPage()).rejects.toThrow("No approved membership found.");
  });

  it("redirects when user not found", async () => {
    mockTicketsList.mockResolvedValue({ items: [] });
    mockUsersMe.mockResolvedValue(null);

    const { default: PortalSupportPage } = await import("@/app/(portal)/portal/support/page");
    const { redirect } = await import("next/navigation");
    await PortalSupportPage();
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
