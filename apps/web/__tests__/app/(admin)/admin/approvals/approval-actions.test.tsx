import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockApproveOrganization = jest.fn();
const mockRejectOrganization = jest.fn();
const mockApproveMembership = jest.fn();
const mockRejectMembership = jest.fn();

jest.mock("@/app/(admin)/admin/approvals/actions", () => ({
  approveOrganization: (...args: unknown[]) => mockApproveOrganization(...args),
  rejectOrganization: (...args: unknown[]) => mockRejectOrganization(...args),
  approveMembership: (...args: unknown[]) => mockApproveMembership(...args),
  rejectMembership: (...args: unknown[]) => mockRejectMembership(...args),
}));

import MembershipApprovalActions from "@/app/(admin)/admin/approvals/MembershipApprovalActions";
import OrgApprovalActions from "@/app/(admin)/admin/approvals/OrgApprovalActions";

describe("MembershipApprovalActions (USE-P2-010)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("confirms rejection before calling the action and reports success", async () => {
    mockRejectMembership.mockResolvedValue({ ok: true });

    render(<MembershipApprovalActions membershipId="mem-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Reject User" }));

    // One-click reject is gone: the dialog must be confirmed first.
    expect(mockRejectMembership).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Reject" }));

    await waitFor(() => expect(mockRejectMembership).toHaveBeenCalledTimes(1));
    const formData = mockRejectMembership.mock.calls[0][0] as FormData;
    expect(formData.get("membershipId")).toBe("mem-1");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Membership rejected."),
    );
  });

  it("approves without a confirmation dialog and reports success", async () => {
    mockApproveMembership.mockResolvedValue({ ok: true });

    render(<MembershipApprovalActions membershipId="mem-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Approve User" }));

    await waitFor(() => expect(mockApproveMembership).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Membership approved."),
    );
  });

  it("surfaces action failures as an alert", async () => {
    mockApproveMembership.mockResolvedValue({ ok: false, error: "Validation failed" });

    render(<MembershipApprovalActions membershipId="mem-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Approve User" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Validation failed"),
    );
  });
});

describe("OrgApprovalActions (USE-P2-010)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("confirms rejection before calling the action and reports success", async () => {
    mockRejectOrganization.mockResolvedValue({ ok: true });

    render(<OrgApprovalActions organizationId="org-1" organizationName="Acme" />);
    await userEvent.click(screen.getByRole("button", { name: "Reject Org" }));

    expect(mockRejectOrganization).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Reject" }));

    await waitFor(() => expect(mockRejectOrganization).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Rejected Acme."),
    );
  });

  it("approves without a confirmation dialog and reports success", async () => {
    mockApproveOrganization.mockResolvedValue({ ok: true });

    render(<OrgApprovalActions organizationId="org-1" organizationName="Acme" />);
    await userEvent.click(screen.getByRole("button", { name: "Approve Org" }));

    await waitFor(() => expect(mockApproveOrganization).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Approved Acme."),
    );
  });
});
