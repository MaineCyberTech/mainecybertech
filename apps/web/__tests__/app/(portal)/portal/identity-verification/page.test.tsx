import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockIdVerifyList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    securitySuite: { idVerify: { list: mockIdVerifyList } },
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

describe("PortalIdentityVerificationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockIdVerifyList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/identity-verification/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /identity verification/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockIdVerifyList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/identity-verification/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockIdVerifyList.mockResolvedValue({
      items: [
        {
          id: "v1",
          requestor_name: "John Doe",
          status: "verified",
          verification_method: "id_card",
          verification_pass: true,
        },
        {
          id: "v2",
          requestor_name: "Jane Smith",
          status: "pending",
          verification_method: "biometric",
          verification_pass: false,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/identity-verification/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText(/Method: id_card/)).toBeInTheDocument();
    expect(screen.getByText(/Method: biometric/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockIdVerifyList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/identity-verification/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No verification requests found.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockIdVerifyList.mockResolvedValue({
      items: [
        {
          id: "v1",
          requestor_name: "John Doe",
          status: "verified",
          verification_method: "id_card",
          verification_pass: true,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/identity-verification/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("verified");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/identity-verification/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
