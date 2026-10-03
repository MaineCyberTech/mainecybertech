import { jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockLoginAction = jest.fn();
const mockMfaVerifyAction = jest.fn();
const mockMfaRecoveryLoginAction = jest.fn();
const mockMfaCancelAction = jest.fn();

jest.mock("@/lib/auth/auth-actions", () => ({
  loginAction: (...args: unknown[]) => mockLoginAction(...args),
  mfaLoginVerifyAction: (...args: unknown[]) => mockMfaVerifyAction(...args),
  mfaRecoveryLoginAction: (...args: unknown[]) => mockMfaRecoveryLoginAction(...args),
  mfaCancelAction: (...args: unknown[]) => mockMfaCancelAction(...args),
}));

const { default: LoginPage } = jest.requireActual("@/app/(public)/login/page") as {
  default: React.ComponentType;
};

async function renderOnMfaStep() {
  mockLoginAction.mockResolvedValue({ mfaRequired: true });
  render(<LoginPage />);

  await userEvent.type(screen.getByPlaceholderText("name@clientdomain.com"), "a@b.com");
  await userEvent.type(screen.getByPlaceholderText("••••••••••"), "password");
  await userEvent.click(screen.getByRole("button", { name: /secure login/i }));

  await screen.findByRole("heading", { name: /two-factor verification/i });
}

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMfaCancelAction.mockResolvedValue(undefined);
  });

  it("renders the login form", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: /secure login/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("name@clientdomain.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /secure login/i })).toBeInTheDocument();
  });

  it("shows error message on failed login", async () => {
    mockLoginAction.mockResolvedValue({ error: "Invalid credentials" });

    render(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText("name@clientdomain.com"), "a@b.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••••"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /secure login/i }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });

  it("calls loginAction with email and password", async () => {
    mockLoginAction.mockResolvedValue(undefined);

    render(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText("name@clientdomain.com"), "a@b.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••••"), "password");
    await userEvent.click(screen.getByRole("button", { name: /secure login/i }));

    await waitFor(() => {
      expect(mockLoginAction).toHaveBeenCalledWith("a@b.com", "password");
    });
  });

  it("shows 'Signing In...' while loading", async () => {
    mockLoginAction.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText("name@clientdomain.com"), "a@b.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••••"), "password");
    await userEvent.click(screen.getByRole("button", { name: /secure login/i }));

    expect(await screen.findByText("Signing In...")).toBeInTheDocument();
  });

  it("returns to the password step when cancelling MFA rejects", async () => {
    mockMfaCancelAction.mockRejectedValue(new Error("network down"));
    await renderOnMfaStep();

    await userEvent.click(screen.getByRole("button", { name: /use a different account/i }));

    expect(await screen.findByRole("heading", { name: /secure login/i })).toBeInTheDocument();
  });

  it("clears codes when switching between authenticator and recovery inputs", async () => {
    await renderOnMfaStep();

    await userEvent.type(screen.getByLabelText("Verification Code"), "123456");
    await userEvent.click(screen.getByRole("button", { name: /use a recovery code instead/i }));

    const recoveryInput = await screen.findByLabelText("Recovery Code");
    expect(recoveryInput).toHaveAttribute("autocapitalize", "characters");
    expect(recoveryInput).toHaveAttribute("spellcheck", "false");
    await userEvent.type(recoveryInput, "ABCDE-FGHIJ");

    await userEvent.click(screen.getByRole("button", { name: /back to authenticator code/i }));

    const totpInput = await screen.findByLabelText("Verification Code");
    expect(totpInput).toHaveValue("");
  });
});
