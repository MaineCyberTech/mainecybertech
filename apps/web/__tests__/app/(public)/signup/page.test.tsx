import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSignupAction = jest.fn();

jest.mock("@/lib/auth/auth-actions", () => ({
  signupAction: (...args: unknown[]) => mockSignupAction(...args),
}));

const { default: SignupPage } = jest.requireActual(
  "@/app/(public)/signup/page",
) as { default: React.ComponentType };

describe("SignupPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the signup form", () => {
    render(<SignupPage />);

    expect(screen.getByText("Create Secure Account")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your full name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("name@clientdomain.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows error message on failed signup", async () => {
    mockSignupAction.mockResolvedValue({ error: "Email already in use" });

    render(<SignupPage />);

    await userEvent.type(screen.getByPlaceholderText("Your full name"), "Alice");
    await userEvent.type(screen.getByPlaceholderText("name@clientdomain.com"), "a@b.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••••"), "password");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Email already in use")).toBeInTheDocument();
  });

  it("shows success message on successful signup", async () => {
    mockSignupAction.mockResolvedValue({ success: true });

    render(<SignupPage />);

    await userEvent.type(screen.getByPlaceholderText("Your full name"), "Alice");
    await userEvent.type(screen.getByPlaceholderText("name@clientdomain.com"), "a@b.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••••"), "password");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(
        "Check your email to confirm your account, then return to continue.",
      ),
    ).toBeInTheDocument();
  });

  it("shows 'Creating Account...' while loading", async () => {
    mockSignupAction.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    render(<SignupPage />);

    await userEvent.type(screen.getByPlaceholderText("Your full name"), "Alice");
    await userEvent.type(screen.getByPlaceholderText("name@clientdomain.com"), "a@b.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••••"), "password");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Creating Account...")).toBeInTheDocument();
  });
});
