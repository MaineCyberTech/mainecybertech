import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockGet = jest.fn();
const mockListTargets = jest.fn();
const mockCreateTarget = jest.fn();
const mockRemoveTarget = jest.fn();

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    eduAutomation: {
      phishing: {
        get: mockGet,
        listTargets: mockListTargets,
        createTarget: mockCreateTarget,
        removeTarget: mockRemoveTarget,
      },
    },
  }),
}));

import PhishingTargetsPanel from "@/app/(admin)/admin/edu-automation/phishing/[id]/PhishingTargetsPanel";

describe("PhishingTargetsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ id: "c1", organization_id: "org-1" });
    mockListTargets.mockResolvedValue({ items: [] });
  });

  it("loads and renders the campaign targets", async () => {
    mockListTargets.mockResolvedValue({
      items: [{ id: "t1", email: "a@b.com", name: "Ada", status: "pending" }],
    });
    render(<PhishingTargetsPanel campaignId="c1" />);

    expect(await screen.findByText(/a@b.com/)).toBeInTheDocument();
    expect(screen.getByText(/pending/)).toBeInTheDocument();
    expect(mockListTargets).toHaveBeenCalledWith("c1", "org-1");
  });

  it("adds a target", async () => {
    mockCreateTarget.mockResolvedValue({ id: "t2" });
    render(<PhishingTargetsPanel campaignId="c1" />);
    await waitFor(() => expect(mockListTargets).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "new@b.com" } });
    fireEvent.click(screen.getByRole("button", { name: /add target/i }));

    await waitFor(() =>
      expect(mockCreateTarget).toHaveBeenCalledWith("c1", "org-1", {
        email: "new@b.com",
        name: null,
      }),
    );
  });

  it("shows an error when loading fails", async () => {
    mockGet.mockRejectedValue(new Error("boom"));
    render(<PhishingTargetsPanel campaignId="c1" />);
    expect(await screen.findByText(/failed to load targets/i)).toBeInTheDocument();
  });
});
