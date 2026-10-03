import type { ComponentProps } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/ToastProvider";

const mockEnroll = jest.fn();
const mockVerify = jest.fn();
const mockRemove = jest.fn();
const mockList = jest.fn();
const mockGenerate = jest.fn();
const mockRevoke = jest.fn();
const mockStepUp = jest.fn();

jest.mock("@/app/(portal)/portal/profile/security/actions", () => ({
  enrollMfaAction: (...args: unknown[]) => mockEnroll(...args),
  verifyMfaAction: (...args: unknown[]) => mockVerify(...args),
  removeMfaAction: (...args: unknown[]) => mockRemove(...args),
  listMfaFactorsAction: (...args: unknown[]) => mockList(...args),
  generateRecoveryCodesAction: (...args: unknown[]) => mockGenerate(...args),
  revokeRecoveryCodesAction: (...args: unknown[]) => mockRevoke(...args),
  stepUpMfaAction: (...args: unknown[]) => mockStepUp(...args),
}));

import MfaSettingsClient from "@/app/(portal)/portal/profile/security/MfaSettingsClient";

function renderClient(props: Partial<ComponentProps<typeof MfaSettingsClient>> = {}) {
  return render(
    <ToastProvider>
      <MfaSettingsClient initialFactors={[]} {...props} />
    </ToastProvider>,
  );
}

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

    renderClient();
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
    expect(
      screen.getByText(/Two-factor authentication enabled/i).closest("[role='status']"),
    ).not.toBeNull();
  });

  it("lists an existing factor and removes it", async () => {
    mockRemove.mockResolvedValue({ ok: true });
    mockList.mockResolvedValue({ ok: true, data: [] });

    renderClient({ initialFactors: [{ id: "f1", friendlyName: "Phone", status: "verified" }] });

    expect(screen.getByText("Phone")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Remove/i }));

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith("f1"));
    await waitFor(() => expect(screen.getByText(/Authenticator removed/i)).toBeInTheDocument());
  });

  it("surfaces an enrollment error as an alert", async () => {
    mockEnroll.mockResolvedValue({ ok: false, error: "MFA is not enabled" });

    renderClient();
    fireEvent.click(screen.getByRole("button", { name: /Add authenticator app/i }));

    await waitFor(() => expect(screen.getByText(/MFA is not enabled/i)).toBeInTheDocument());
    expect(screen.getByText(/MFA is not enabled/i).closest("[role='alert']")).not.toBeNull();
  });

  it("renders the recovery code status", () => {
    renderClient({
      initialRecovery: {
        remaining: 4,
        total: 10,
        lastGeneratedAt: "2026-09-01T12:00:00.000Z",
      },
    });

    expect(screen.getByText(/4 of 10 recovery codes remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/last generated Sep 1, 2026/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Revoke codes/i })).toBeInTheDocument();
  });

  it("hides revoke when no codes remain even if a generation date exists", () => {
    renderClient({
      initialRecovery: {
        remaining: 0,
        total: 10,
        lastGeneratedAt: "2026-09-01T12:00:00.000Z",
      },
    });

    expect(screen.getByText(/0 of 10 recovery codes remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/last generated Sep 1, 2026/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Revoke codes/i })).not.toBeInTheDocument();
  });

  it("generates recovery codes once and copies them", async () => {
    const codes = [
      "ABCDE-FGHIJ",
      "KLMNP-QRSTU",
      "VWXYZ-23456",
      "BCDEF-GHIJK",
      "LMNPQ-RSTUV",
      "WXYZA-23457",
      "CDEFG-HIJKL",
      "MNPQR-STUVW",
      "XYZA2-34567",
      "DEFGH-JKLMN",
    ];
    mockGenerate.mockResolvedValue({ ok: true, data: { codes, remaining: 10 } });
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    renderClient();
    fireEvent.click(screen.getByRole("button", { name: /Generate codes/i }));

    await waitFor(() => expect(screen.getByText("ABCDE-FGHIJ")).toBeInTheDocument());
    expect(screen.getByText(/shown only once/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/10 of 10 recovery codes remaining/i)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Copy codes/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(codes.join("\n")));
    await waitFor(() =>
      expect(screen.getByText(/Recovery codes copied to your clipboard/i)).toBeInTheDocument(),
    );
  });

  it("revokes recovery codes after confirmation", async () => {
    mockRevoke.mockResolvedValue({ ok: true });

    renderClient({
      initialRecovery: {
        remaining: 6,
        total: 10,
        lastGeneratedAt: "2026-09-01T12:00:00.000Z",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /Revoke codes/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Revoke all recovery codes\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Revoke$/i }));

    await waitFor(() => expect(mockRevoke).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByText(/All recovery codes were revoked/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/0 of 10 recovery codes remaining/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Revoke codes/i })).not.toBeInTheDocument();
  });

  it("shows the recovered notice after a recovery-code login", () => {
    renderClient({ recovered: true });

    const notice = screen
      .getAllByRole("status")
      .find((el) =>
        /Your authenticator was reset with a recovery code/i.test(el.textContent ?? ""),
      );
    expect(notice).toBeTruthy();
    expect(notice).toHaveTextContent(
      /Enroll a new authenticator to restore two-factor protection\./i,
    );
    expect(screen.getByRole("link", { name: /Enroll a new authenticator/i })).toHaveAttribute(
      "href",
      "#authenticator-app",
    );
  });

  it("prompts for a step-up code when generation requires MFA and retries after confirm", async () => {
    const codes = ["ABCDE-FGHIJ"];
    mockGenerate
      .mockResolvedValueOnce({
        ok: false,
        error: "Second factor required. Verify your authenticator app, then try again.",
        code: "MFA_REQUIRED",
      })
      .mockResolvedValueOnce({ ok: true, data: { codes, remaining: 10 } });
    mockStepUp.mockResolvedValue({
      ok: true,
      data: { user: { id: "u1", email: "user@example.com" } },
    });

    renderClient({ initialFactors: [{ id: "f1", friendlyName: "Phone", status: "verified" }] });
    fireEvent.click(screen.getByRole("button", { name: /Generate codes/i }));

    await waitFor(() =>
      expect(screen.getByText(/Confirm your authenticator code to continue/i)).toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.getByLabelText(/Authenticator code/i)).toHaveFocus());
    expect(screen.queryByText(/Second factor required/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Authenticator code/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Confirm$/i }));

    await waitFor(() => expect(mockStepUp).toHaveBeenCalledWith("f1", "123456"));
    await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText("ABCDE-FGHIJ")).toBeInTheDocument());
    expect(
      screen.queryByText(/Confirm your authenticator code to continue/i),
    ).not.toBeInTheDocument();
  });

  it("shows the step-up error and keeps the prompt open for a wrong code", async () => {
    mockGenerate.mockResolvedValue({
      ok: false,
      error: "Second factor required. Verify your authenticator app, then try again.",
      code: "MFA_REQUIRED",
    });
    mockStepUp.mockResolvedValue({ ok: false, error: "Invalid code" });

    renderClient({ initialFactors: [{ id: "f1", friendlyName: "Phone", status: "verified" }] });
    fireEvent.click(screen.getByRole("button", { name: /Generate codes/i }));
    await waitFor(() => expect(screen.getByLabelText(/Authenticator code/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Authenticator code/i), {
      target: { value: "000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Confirm$/i }));

    await waitFor(() => expect(screen.getByText(/Invalid code/i)).toBeInTheDocument());
    expect(screen.getByText(/Confirm your authenticator code to continue/i)).toBeInTheDocument();
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it("reports when no verified factor is available for step-up", async () => {
    mockGenerate.mockResolvedValue({
      ok: false,
      error: "Second factor required. Verify your authenticator app, then try again.",
      code: "MFA_REQUIRED",
    });

    renderClient();
    fireEvent.click(screen.getByRole("button", { name: /Generate codes/i }));
    await waitFor(() => expect(screen.getByLabelText(/Authenticator code/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Authenticator code/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Confirm$/i }));

    await waitFor(() =>
      expect(screen.getByText(/No verified authenticator app was found/i)).toBeInTheDocument(),
    );
    expect(mockStepUp).not.toHaveBeenCalled();
  });

  it("steps up before retrying revocation", async () => {
    mockRevoke
      .mockResolvedValueOnce({
        ok: false,
        error: "Second factor required. Verify your authenticator app, then try again.",
        code: "MFA_REQUIRED",
      })
      .mockResolvedValueOnce({ ok: true });
    mockStepUp.mockResolvedValue({
      ok: true,
      data: { user: { id: "u1", email: "user@example.com" } },
    });

    renderClient({
      initialFactors: [{ id: "f1", friendlyName: "Phone", status: "verified" }],
      initialRecovery: {
        remaining: 6,
        total: 10,
        lastGeneratedAt: "2026-09-01T12:00:00.000Z",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /Revoke codes/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Revoke$/i }));
    await waitFor(() => expect(screen.getByLabelText(/Authenticator code/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Authenticator code/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Confirm$/i }));

    await waitFor(() => expect(mockStepUp).toHaveBeenCalledWith("f1", "123456"));
    await waitFor(() => expect(mockRevoke).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByText(/All recovery codes were revoked/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/0 of 10 recovery codes remaining/i)).toBeInTheDocument();
  });
});
