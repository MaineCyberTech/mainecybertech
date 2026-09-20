import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });
const mockCreate = jest.fn();

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    satisfactionPulse: { create: mockCreate },
  }),
}));

jest.mock("@/components/Breadcrumbs", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "aria-label": "Breadcrumb" }),
}));

jest.mock("@/components/portal/PortalSubnav", () => ({
  __esModule: true,
  default: () => React.createElement("nav", null),
}));

describe("PortalFeedbackPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders the heading and feedback form", async () => {
    const { default: Page } = await import("@/app/(portal)/portal/feedback/page");
    render(await Page());

    expect(screen.getByRole("heading", { name: /^feedback$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit feedback/i })).toBeInTheDocument();
  });

  it("renders nothing without an approved membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } = await import("@/app/(portal)/portal/feedback/page");
    expect(await Page()).toBeNull();
  });
});

describe("PortalFeedbackForm", () => {
  beforeEach(() => jest.clearAllMocks());

  it("submits feedback as a portal-sourced pulse", async () => {
    mockCreate.mockResolvedValue({ id: "p1" });
    const { default: Form } = await import("@/app/(portal)/portal/feedback/PortalFeedbackForm");
    render(<Form organizationId="org-1" />);

    fireEvent.change(screen.getByPlaceholderText(/summary/i), {
      target: { value: "Great work" },
    });
    fireEvent.change(screen.getByPlaceholderText(/working well/i), {
      target: { value: "Fast response" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit feedback/i }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        subject: "Great work",
        feedback: "Fast response",
        source: "portal",
        rating: 8,
      }),
    );
    expect(await screen.findByText(/thank you/i)).toBeInTheDocument();
  });

  it("shows an error when submission fails", async () => {
    mockCreate.mockRejectedValue(new Error("boom"));
    const { default: Form } = await import("@/app/(portal)/portal/feedback/PortalFeedbackForm");
    render(<Form organizationId="org-1" />);

    fireEvent.click(screen.getByRole("button", { name: /submit feedback/i }));

    expect(await screen.findByText(/failed to submit/i)).toBeInTheDocument();
  });
});
