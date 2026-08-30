import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockTicketsGet = jest.fn();
const mockTicketsListComments = jest.fn();
const mockUsersMe = jest.fn();
const mockRequireAdminAccess = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    tickets: {
      get: mockTicketsGet,
      listComments: mockTicketsListComments,
    },
    users: { me: mockUsersMe },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: mockRequireAdminAccess,
}));

jest.mock("@/components/CommentBody", () => ({
  __esModule: true,
  default: ({ body }: { body: string }) => <div data-testid="comment-body">{body}</div>,
}));

describe("PortalSupportDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
    mockUsersMe.mockResolvedValue({ userId: "user-1" });
    mockRequireAdminAccess.mockRejectedValue(new Error("Not admin"));
  });

  it("renders ticket subject and status", async () => {
    mockTicketsGet.mockResolvedValue({
      id: "t1",
      subject: "Login Issue",
      status: "new",
      priority: "normal",
      category: "Authentication",
      description: "Cannot log in",
    });
    mockTicketsListComments.mockResolvedValue([]);

    const { default: PortalSupportDetailPage } =
      await import("@/app/(portal)/portal/support/[ticketId]/page");
    const element = await PortalSupportDetailPage({ params: Promise.resolve({ ticketId: "t1" }) });
    render(element);

    expect(screen.getAllByText("Login Issue").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("new")).toBeInTheDocument();
    expect(screen.getByText("normal")).toBeInTheDocument();
    expect(screen.getByText(/category:.*authentication/i)).toBeInTheDocument();
    expect(screen.getByText("Cannot log in")).toBeInTheDocument();
  });

  it("renders comments when present", async () => {
    mockTicketsGet.mockResolvedValue({
      id: "t1",
      subject: "Login Issue",
      status: "open",
      priority: "high",
    });
    mockTicketsListComments.mockResolvedValue([
      {
        id: "c1",
        body: "We are investigating",
        created_at: new Date().toISOString(),
        author_name: "Admin User",
      },
    ]);

    const { default: PortalSupportDetailPage } =
      await import("@/app/(portal)/portal/support/[ticketId]/page");
    const element = await PortalSupportDetailPage({ params: Promise.resolve({ ticketId: "t1" }) });
    render(element);

    expect(screen.getByText("We are investigating")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });

  it("shows no comments message when empty", async () => {
    mockTicketsGet.mockResolvedValue({
      id: "t1",
      subject: "Login Issue",
      status: "open",
      priority: "normal",
    });
    mockTicketsListComments.mockResolvedValue([]);

    const { default: PortalSupportDetailPage } =
      await import("@/app/(portal)/portal/support/[ticketId]/page");
    const element = await PortalSupportDetailPage({ params: Promise.resolve({ ticketId: "t1" }) });
    render(element);

    expect(screen.getByText("No comments yet.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: PortalSupportDetailPage } =
      await import("@/app/(portal)/portal/support/[ticketId]/page");
    const element = await PortalSupportDetailPage({ params: Promise.resolve({ ticketId: "t1" }) });
    render(element);

    expect(screen.getByText(/access restricted/i)).toBeInTheDocument();
  });

  it("shows ticket not found when API throws", async () => {
    mockTicketsGet.mockRejectedValue(new Error("Not found"));

    const { default: PortalSupportDetailPage } =
      await import("@/app/(portal)/portal/support/[ticketId]/page");
    const element = await PortalSupportDetailPage({ params: Promise.resolve({ ticketId: "t1" }) });
    render(element);

    expect(screen.getByText("Ticket not found.")).toBeInTheDocument();
  });

  it("shows view in admin link for admin users", async () => {
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockTicketsGet.mockResolvedValue({
      id: "t1",
      subject: "Login Issue",
      status: "open",
      priority: "normal",
    });
    mockTicketsListComments.mockResolvedValue([]);

    const { default: PortalSupportDetailPage } =
      await import("@/app/(portal)/portal/support/[ticketId]/page");
    const element = await PortalSupportDetailPage({ params: Promise.resolve({ ticketId: "t1" }) });
    render(element);

    expect(screen.getByText("View in Admin")).toBeInTheDocument();
  });

  it("hides view in admin link for non-admin users", async () => {
    mockRequireAdminAccess.mockRejectedValue(new Error("Not admin"));
    mockTicketsGet.mockResolvedValue({
      id: "t1",
      subject: "Login Issue",
      status: "open",
      priority: "normal",
    });
    mockTicketsListComments.mockResolvedValue([]);

    const { default: PortalSupportDetailPage } =
      await import("@/app/(portal)/portal/support/[ticketId]/page");
    const element = await PortalSupportDetailPage({ params: Promise.resolve({ ticketId: "t1" }) });
    render(element);

    expect(screen.queryByText("View in Admin")).not.toBeInTheDocument();
  });

  it("renders back to support link", async () => {
    mockTicketsGet.mockResolvedValue({
      id: "t1",
      subject: "Login Issue",
      status: "open",
      priority: "normal",
    });
    mockTicketsListComments.mockResolvedValue([]);

    const { default: PortalSupportDetailPage } =
      await import("@/app/(portal)/portal/support/[ticketId]/page");
    const element = await PortalSupportDetailPage({ params: Promise.resolve({ ticketId: "t1" }) });
    render(element);

    const backLink = screen.getByText("Back to Support").closest("a");
    expect(backLink).toHaveAttribute("href", "/portal/support");
  });
});
