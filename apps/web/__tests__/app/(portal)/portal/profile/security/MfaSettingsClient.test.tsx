import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockEnroll = jest.fn();
const mockVerify = jest.fn();
const mockRemove = jest.fn();
const mockList = jest.fn();

jest.mock("@/app/(portal)/portal/profile/security/actions", () => ({
  enrollMfaAction: (...args: unknown[]) => mockEnroll(...args),
  verifyMfaAction: (...args: unknown[]) => mockVerify(...args),
  removeMfaAction: (...args: unknown[]) => mockRemove(...args),
  listMfaFactorsAction: (...args: unknown[]) => mockList(...args),
}));

import MfaSettingsClient from "@/app/(portal)/portal/profile/security/MfaSettingsClient";

describe("MfaSettingsClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the empty state and completes an enroll + verify flow", async () => {
    mockEnroll.mockResolvedValue({
      ok: true,
      data: { factorId: "f1", qrCode: "<svg></svg>", secret: "ABC123" },
    });
    mockVerify.mockResolvedValue({ ok: true });
    mockList.mockResolvedValue({
      ok: true,
      data: [{ id: "f1", friendlyName: "Authenticator app", status: "verified" }],
    });

    render(<MfaSettingsClient initialFactors={[]} />);
    expect(screen.getByText(/No authenticator app is enrolled/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Add authenticator app/i }));
    await waitFor(() => expect(screen.getByText(/ABC123/)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Verification code/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Verify$/i }));

    await waitFor(() =>
      expect(screen.getByText(/Two-factor authentication enabled/i)).toBeInTheDocument(),
    );
    expect(mockVerify).toHaveBeenCalledWith("f1", "123456");
  });

  it("lists an existing factor and removes it", async () => {
    mockRemove.mockResolvedValue({ ok: true });
    mockList.mockResolvedValue({ ok: true, data: [] });

    render(
      <MfaSettingsClient
        initialFactors={[{ id: "f1", friendlyName: "Phone", status: "verified" }]}
      />,
    );

    expect(screen.getByText("Phone")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Remove/i }));

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith("f1"));
    await waitFor(() => expect(screen.getByText(/Authenticator removed/i)).toBeInTheDocument());
  });

  it("surfaces an enrollment error", async () => {
    mockEnroll.mockResolvedValue({ ok: false, error: "MFA is not enabled" });

    render(<MfaSettingsClient initialFactors={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /Add authenticator app/i }));

    await waitFor(() => expect(screen.getByText(/MFA is not enabled/i)).toBeInTheDocument());
  });
});
