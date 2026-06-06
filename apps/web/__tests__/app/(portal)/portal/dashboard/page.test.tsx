import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockOrganizationsGet = jest.fn();
const mockProjectsList = jest.fn();
const mockTicketsList = jest.fn();
const mockDocumentsList = jest.fn();
const mockGetApprovedMembership = jest
  .fn()
  .mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    organizations: { get: mockOrganizationsGet },
    projects: { list: mockProjectsList },
    tickets: { list: mockTicketsList },
    documents: { list: mockDocumentsList },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

describe("PortalDashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders organization name", async () => {
    mockOrganizationsGet.mockResolvedValue({ name: "Acme Corp" });
    mockProjectsList.mockResolvedValue({ items: [] });
    mockTicketsList.mockResolvedValue({ items: [] });
    mockDocumentsList.mockResolvedValue({ items: [] });

    const { default: PortalDashboardPage } = await import(
      "@/app/(portal)/portal/dashboard/page"
    );
    const element = await PortalDashboardPage();
    render(element);

    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /client dashboard/i }),
    ).toBeInTheDocument();
  });

  it("renders empty state when no projects or tickets", async () => {
    mockOrganizationsGet.mockResolvedValue({ name: "Test Org" });
    mockProjectsList.mockResolvedValue({ items: [] });
    mockTicketsList.mockResolvedValue({ items: [] });
    mockDocumentsList.mockResolvedValue({ items: [] });

    const { default: PortalDashboardPage } = await import(
      "@/app/(portal)/portal/dashboard/page"
    );
    const element = await PortalDashboardPage();
    render(element);

    expect(
      screen.getByText(/no recent project activity/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no recent support activity/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no recent documents/i),
    ).toBeInTheDocument();
  });

  it("renders projects and tickets when data exists", async () => {
    mockOrganizationsGet.mockResolvedValue({ name: "Test Org" });
    mockProjectsList.mockResolvedValue({
      items: [
        {
          id: "p1",
          name: "Project Alpha",
          updated_at: new Date().toISOString(),
        },
      ],
    });
    mockTicketsList.mockResolvedValue({
      items: [
        {
          id: "t1",
          subject: "Login Issue",
          created_at: new Date().toISOString(),
        },
      ],
    });
    mockDocumentsList.mockResolvedValue({ items: [] });

    const { default: PortalDashboardPage } = await import(
      "@/app/(portal)/portal/dashboard/page"
    );
    const element = await PortalDashboardPage();
    render(element);

    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("Login Issue")).toBeInTheDocument();
  });

  it("renders recent documents when data exists", async () => {
    mockOrganizationsGet.mockResolvedValue({ name: "Test Org" });
    mockProjectsList.mockResolvedValue({ items: [] });
    mockTicketsList.mockResolvedValue({ items: [] });
    mockDocumentsList.mockResolvedValue({
      items: [
        { id: "d1", name: "Report Q1", updated_at: new Date().toISOString() },
        { id: "d2", name: "Security Policy", description: "InfoSec doc", created_at: new Date().toISOString() },
      ],
    });

    const { default: PortalDashboardPage } = await import(
      "@/app/(portal)/portal/dashboard/page"
    );
    const element = await PortalDashboardPage();
    render(element);

    expect(screen.getByText("Report Q1")).toBeInTheDocument();
    expect(screen.getByText("Security Policy")).toBeInTheDocument();
    expect(screen.getByText("InfoSec doc")).toBeInTheDocument();
  });

  it("falls back to title field when ticket has no subject", async () => {
    mockOrganizationsGet.mockResolvedValue({ name: "Test Org" });
    mockProjectsList.mockResolvedValue({ items: [] });
    mockTicketsList.mockResolvedValue({
      items: [
        {
          id: "t1",
          title: "Fallback Title",
          created_at: new Date().toISOString(),
        },
      ],
    });
    mockDocumentsList.mockResolvedValue({ items: [] });

    const { default: PortalDashboardPage } = await import(
      "@/app/(portal)/portal/dashboard/page"
    );
    const element = await PortalDashboardPage();
    render(element);

    expect(screen.getByText("Fallback Title")).toBeInTheDocument();
  });

  it("shows no-org message when no approved membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: PortalDashboardPage } = await import(
      "@/app/(portal)/portal/dashboard/page"
    );
    const element = await PortalDashboardPage();
    render(element);

    expect(screen.getByText(/no organization access/i)).toBeInTheDocument();
    expect(screen.getByText(/not currently a member/i)).toBeInTheDocument();
  });
});
