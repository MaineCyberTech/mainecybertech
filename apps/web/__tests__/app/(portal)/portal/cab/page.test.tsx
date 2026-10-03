import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockList = jest.fn();
const mockChangesList = jest.fn().mockResolvedValue({ items: [] });
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });
const mockRefresh = jest.fn();
const mockCabCreate = jest.fn();
const mockCabAddAgenda = jest.fn();
const mockCabUpdateAgenda = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    cab: {
      create: mockCabCreate,
      addAgendaItem: mockCabAddAgenda,
      updateAgendaItem: mockCabUpdateAgenda,
    },
  }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    cab: { list: mockList },
    governance: { changes: { list: mockChangesList } },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("@/components/Breadcrumbs", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "aria-label": "Breadcrumb" }),
}));

jest.mock(
  "@/components/StatusPill",
  () => ({
    __esModule: true,
    default: ({ status }: { status: string }) =>
      React.createElement("span", { "data-testid": "status-pill" }, status),
  }),
  { virtual: true },
);

describe("PortalCabPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
    mockList.mockResolvedValue({ items: [] });
    mockChangesList.mockResolvedValue({ items: [] });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/cab/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /change advisory board/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/cab/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders meetings when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "m1",
          scheduled_at: "2026-09-01T15:00:00Z",
          status: "scheduled",
          notes: "Q3 review",
          agenda: [
            {
              id: "a1",
              meeting_id: "m1",
              change_request_id: "00000000-0000-0000-0000-0000000000aa",
              decision: "approved",
            },
          ],
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/cab/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Q3 review")).toBeInTheDocument();
    expect(screen.getByText(/Agenda \(1\)/)).toBeInTheDocument();
    const pills = screen.getAllByTestId("status-pill");
    expect(pills.some((p) => p.textContent === "scheduled")).toBe(true);
    expect(pills.some((p) => p.textContent === "approved")).toBe(true);
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/cab/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No CAB meetings scheduled.")).toBeInTheDocument();
  });

  it("renders pending change requests", async () => {
    mockList.mockResolvedValue({ items: [] });
    mockChangesList.mockResolvedValue({
      items: [{ id: "cr1", title: "Firewall rule update", status: "pending", priority: "high" }],
    });

    const { default: Page } = await import("@/app/(portal)/portal/cab/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Firewall rule update")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/cab/page");
    const element = await Page();

    expect(element).toBeNull();
  });

  it("schedules a meeting", async () => {
    mockList.mockResolvedValue({ items: [] });
    mockCabCreate.mockResolvedValue({ id: "m1" });
    const { default: Page } = await import("@/app/(portal)/portal/cab/page");
    render(await Page());

    fireEvent.change(screen.getByLabelText(/date & time/i), {
      target: { value: "2026-10-01T15:00" },
    });
    fireEvent.change(screen.getByPlaceholderText(/agenda focus/i), {
      target: { value: "Quarterly" },
    });
    fireEvent.click(screen.getByRole("button", { name: /schedule meeting/i }));

    await waitFor(() => expect(mockCabCreate).toHaveBeenCalledTimes(1));
    expect(mockCabCreate).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", notes: "Quarterly" }),
    );
  });

  it("records an agenda decision", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "m1",
          scheduled_at: "2026-09-01T15:00:00Z",
          status: "scheduled",
          notes: "Q3 review",
          agenda: [
            {
              id: "a1",
              meeting_id: "m1",
              change_request_id: "00000000-0000-0000-0000-0000000000aa",
              decision: "pending",
              notes: null,
            },
          ],
        },
      ],
    });
    mockCabUpdateAgenda.mockResolvedValue({ id: "a1" });
    const { default: Page } = await import("@/app/(portal)/portal/cab/page");
    render(await Page());

    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(mockCabUpdateAgenda).toHaveBeenCalledWith("a1", { decision: "approved" }),
    );
  });

  it("adds a pending change request to a meeting agenda", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "m1",
          scheduled_at: "2026-09-01T15:00:00Z",
          status: "scheduled",
          notes: null,
          agenda: [],
        },
      ],
    });
    mockChangesList.mockResolvedValue({
      items: [{ id: "cr1", title: "Firewall rule update", status: "pending" }],
    });
    mockCabAddAgenda.mockResolvedValue({ id: "a2" });
    const { default: Page } = await import("@/app/(portal)/portal/cab/page");
    render(await Page());

    fireEvent.change(screen.getByLabelText("Meeting"), { target: { value: "m1" } });
    fireEvent.click(screen.getByRole("button", { name: /add to agenda/i }));

    await waitFor(() =>
      expect(mockCabAddAgenda).toHaveBeenCalledWith("m1", {
        organizationId: "org-1",
        changeRequestId: "cr1",
      }),
    );
  });
});
