import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockLoginAction = jest.fn();

jest.mock("@/lib/auth/auth-actions", () => ({
  loginAction: (...args: unknown[]) => mockLoginAction(...args),
}));

const { default: LoginPage } = jest.requireActual(
  "@/app/(public)/login/page",
) as { default: React.ComponentType };

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    mockLoginAction.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    render(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText("name@clientdomain.com"), "a@b.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••••"), "password");
    await userEvent.click(screen.getByRole("button", { name: /secure login/i }));

    expect(await screen.findByText("Signing In...")).toBeInTheDocument();
  });
});
