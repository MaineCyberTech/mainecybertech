import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUpdateMembership = jest.fn();
jest.mock("@/app/(admin)/admin/users/[userId]/actions", () => ({
  updateMembership: (...args: unknown[]) => mockUpdateMembership(...args),
}));

import MembershipForm from "@/app/(admin)/admin/users/[userId]/MembershipForm";

const baseProps = {
  membershipId: "mem-1",
  userId: "user-1",
  organizationName: "Acme Corp",
  roleId: "role-admin",
  status: "approved",
  isBillingContact: false,
  isSecurityContact: false,
  allRoles: [{ id: "role-admin", name: "Admin", key: "admin" }],
};

describe("MembershipForm (USE-P2-010)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("confirms before saving an access-removing status", async () => {
    mockUpdateMembership.mockResolvedValue({ ok: true });

    render(<MembershipForm {...baseProps} />);
    await userEvent.selectOptions(screen.getByLabelText("Status"), "suspended");
    await userEvent.click(screen.getByRole("button", { name: "Save Membership" }));

    // The suspend transition must be confirmed, not saved on one click.
    expect(mockUpdateMembership).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Remove this user's access\?/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(mockUpdateMembership).toHaveBeenCalledTimes(1));
    const formData = mockUpdateMembership.mock.calls[0][0] as FormData;
    expect(formData.get("status")).toBe("suspended");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Membership saved."),
    );
  });

  it("saves a non-destructive change without a dialog", async () => {
    mockUpdateMembership.mockResolvedValue({ ok: true });

    render(<MembershipForm {...baseProps} />);
    await userEvent.click(screen.getByRole("button", { name: "Save Membership" }));

    await waitFor(() => expect(mockUpdateMembership).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Membership saved."),
    );
  });

  it("surfaces save failures as an alert", async () => {
    mockUpdateMembership.mockResolvedValue({ ok: false, error: "Forbidden" });

    render(<MembershipForm {...baseProps} />);
    await userEvent.click(screen.getByRole("button", { name: "Save Membership" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Forbidden"));
  });
});
