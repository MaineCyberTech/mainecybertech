import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockAccept = jest.fn();
const mockReopen = jest.fn();

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    governance: { risks: { accept: mockAccept, reopen: mockReopen } },
  }),
}));

import RiskAcceptButton from "@/app/(admin)/admin/governance/risks/[id]/RiskAcceptButton";

describe("RiskAcceptButton", () => {
  beforeEach(() => jest.clearAllMocks());

  it("accepts an open risk with an expiry", async () => {
    mockAccept.mockResolvedValue({ id: "r1", status: "accepted" });
    render(<RiskAcceptButton id="r1" status="open" />);

    fireEvent.change(screen.getByLabelText(/acceptance expires/i), {
      target: { value: "2027-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/accepting controls/i), {
      target: { value: "EDR + MFA" },
    });
    fireEvent.click(screen.getByRole("button", { name: /accept risk/i }));

    await waitFor(() => expect(mockAccept).toHaveBeenCalledTimes(1));
    expect(mockAccept).toHaveBeenCalledWith(
      "r1",
      expect.objectContaining({ acceptingControls: "EDR + MFA" }),
    );
    expect(await screen.findByText(/risk accepted/i)).toBeInTheDocument();
  });

  it("reopens an accepted risk", async () => {
    mockReopen.mockResolvedValue({ id: "r1", status: "open" });
    render(<RiskAcceptButton id="r1" status="accepted" />);

    fireEvent.click(screen.getByRole("button", { name: /reopen risk/i }));

    await waitFor(() => expect(mockReopen).toHaveBeenCalledWith("r1"));
    expect(await screen.findByText(/risk reopened/i)).toBeInTheDocument();
  });

  it("shows an error when acceptance fails", async () => {
    mockAccept.mockRejectedValue(new Error("boom"));
    render(<RiskAcceptButton id="r1" status="open" />);

    fireEvent.click(screen.getByRole("button", { name: /accept risk/i }));
    expect(await screen.findByText(/failed to accept/i)).toBeInTheDocument();
  });
});
