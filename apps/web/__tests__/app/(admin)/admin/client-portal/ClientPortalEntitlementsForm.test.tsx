import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockGetEntitlements = jest.fn();
const mockSetEntitlements = jest.fn();

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    clientPortal: { getEntitlements: mockGetEntitlements, setEntitlements: mockSetEntitlements },
  }),
}));

import ClientPortalEntitlementsForm from "@/app/(admin)/admin/client-portal/ClientPortalEntitlementsForm";

describe("ClientPortalEntitlementsForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEntitlements.mockResolvedValue({ items: [] });
  });

  it("loads existing entitlements", async () => {
    mockGetEntitlements.mockResolvedValue({
      items: [{ module_key: "dashboard", enabled: true }],
    });
    render(<ClientPortalEntitlementsForm organizationId="org-1" />);

    const dashboard = await screen.findByRole("checkbox", { name: "dashboard" });
    await waitFor(() => expect(dashboard).toBeChecked());
    expect(mockGetEntitlements).toHaveBeenCalledWith("org-1");
  });

  it("saves the full module list", async () => {
    mockSetEntitlements.mockResolvedValue({ updated: 14 });
    render(<ClientPortalEntitlementsForm organizationId="org-1" />);

    await waitFor(() => expect(mockGetEntitlements).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("checkbox", { name: "dashboard" }));
    fireEvent.click(screen.getByRole("button", { name: /save modules/i }));

    await waitFor(() => expect(mockSetEntitlements).toHaveBeenCalledTimes(1));
    const [, modules] = mockSetEntitlements.mock.calls[0] as unknown as [
      string,
      Array<{ moduleKey: string; enabled: boolean }>,
    ];
    expect(modules).toHaveLength(14);
    expect(modules).toContainEqual({ moduleKey: "dashboard", enabled: true });
    expect(await screen.findByText(/entitlements saved/i)).toBeInTheDocument();
  });

  it("shows an error when saving fails", async () => {
    mockSetEntitlements.mockRejectedValue(new Error("boom"));
    render(<ClientPortalEntitlementsForm organizationId="org-1" />);
    await waitFor(() => expect(mockGetEntitlements).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /save modules/i }));
    expect(await screen.findByText(/failed to save entitlements/i)).toBeInTheDocument();
  });
});
