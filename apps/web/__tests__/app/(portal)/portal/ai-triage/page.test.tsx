import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockTriageList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });
const mockRefresh = jest.fn();
const mockTriageAnalyze = jest.fn();
const mockTriageConvert = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    ai: { triageAnalyze: mockTriageAnalyze, triageConvert: mockTriageConvert },
  }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    ai: { triageList: mockTriageList },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("@/components/Breadcrumbs", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "aria-label": "Breadcrumb" }),
}));

jest.mock("@/components/portal/PortalSubnav", () => ({
  __esModule: true,
  default: () => React.createElement("nav", null),
}));

describe("AiTriagePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockTriageList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/ai-triage/page");
    const element = await Page();
    render(element);
    expect(screen.getByRole("heading", { name: /ai triage/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockTriageList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/ai-triage/page");
    const element = await Page();
    render(element);
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state", async () => {
    mockTriageList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/ai-triage/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/no triage records found/i)).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } = await import("@/app/(portal)/portal/ai-triage/page");
    const element = await Page();
    expect(element).toBeNull();
  });

  it("renders items when data exists", async () => {
    mockTriageList.mockResolvedValue({
      items: [
        {
          id: "1",
          raw_description: "Test item",
          status: "pending",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const { default: Page } = await import("@/app/(portal)/portal/ai-triage/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/test item/i)).toBeInTheDocument();
  });

  it("analyzes a description and shows the suggested triage", async () => {
    mockTriageList.mockResolvedValue({ items: [] });
    mockTriageAnalyze.mockResolvedValue({
      id: "d1",
      suggested_category: "Network",
      suggested_priority: "high",
      suggested_subject: "[Network] VPN down",
      missing_info: ["affected users"],
      confidence_score: 80,
    });
    const { default: Page } = await import("@/app/(portal)/portal/ai-triage/page");
    render(await Page());

    fireEvent.change(screen.getByPlaceholderText(/describe the issue/i), {
      target: { value: "The VPN keeps dropping for our team" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^analyze$/i }));

    expect(await screen.findByText("Network")).toBeInTheDocument();
    expect(screen.getByText(/VPN down/)).toBeInTheDocument();
    expect(screen.getByText(/affected users/)).toBeInTheDocument();
    expect(mockTriageAnalyze).toHaveBeenCalledWith({
      organizationId: "org-1",
      rawDescription: "The VPN keeps dropping for our team",
    });
  });

  it("converts the analysis into a ticket", async () => {
    mockTriageList.mockResolvedValue({ items: [] });
    mockTriageAnalyze.mockResolvedValue({
      id: "d1",
      suggested_category: "Network",
      suggested_priority: "high",
      suggested_subject: "[Network] VPN down",
      missing_info: [],
      confidence_score: 80,
    });
    mockTriageConvert.mockResolvedValue({ ticket: { id: "t-9" }, triageId: "d1" });
    const { default: Page } = await import("@/app/(portal)/portal/ai-triage/page");
    render(await Page());

    fireEvent.change(screen.getByPlaceholderText(/describe the issue/i), {
      target: { value: "The VPN keeps dropping for our team" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^analyze$/i }));
    fireEvent.click(await screen.findByRole("button", { name: /create ticket/i }));

    await waitFor(() => expect(mockTriageConvert).toHaveBeenCalledTimes(1));
    expect(mockTriageConvert).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        triageId: "d1",
        subject: "[Network] VPN down",
      }),
    );
    expect(await screen.findByText(/ticket created/i)).toBeInTheDocument();
  });
});
