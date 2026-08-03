import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockTestLoginAction = jest.fn();
jest.mock("@/lib/auth/auth-actions", () => ({
  testLoginAction: (...args: any[]) => mockTestLoginAction(...args),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("TestAccountsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED = "true";
    mockTestLoginAction.mockResolvedValue({
      ok: true,
      redirectTo: "/portal/dashboard",
    });
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED;
  });

  function setHostname(hostname: string) {
    Object.defineProperty(window, "location", {
      value: { hostname },
      writable: true,
      configurable: true,
    });
  }

  it("shows a Not Available state when test accounts are disabled", async () => {
    delete process.env.NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED;
    setHostname("app.mainecybertech.com");
    const { default: Page } = await import("@/app/(public)/test-accounts/page");
    render(<Page />);
    expect(screen.getByText("Not Available")).toBeInTheDocument();
    expect(screen.queryByText("Marcus Chen")).not.toBeInTheDocument();
  });

  it("enables on the dev domain (.us) even without the env flag", async () => {
    delete process.env.NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED;
    setHostname("app.mainecybertech.us");
    const { default: Page } = await import("@/app/(public)/test-accounts/page");
    render(<Page />);
    expect(screen.getByText("Test Accounts")).toBeInTheDocument();
    expect(screen.getByText("Marcus Chen")).toBeInTheDocument();
  });

  it("renders the account grid with all seeded users", async () => {
    const { default: Page } = await import("@/app/(public)/test-accounts/page");
    render(<Page />);
    expect(screen.getByText("Test Accounts")).toBeInTheDocument();
    expect(screen.getByText("Julian Super Admin")).toBeInTheDocument();
    expect(screen.getByText("Marcus Chen")).toBeInTheDocument();
    expect(screen.getByText("Elena Volkov")).toBeInTheDocument();
    expect(screen.getByText("Aisha Johnson")).toBeInTheDocument();
    expect(screen.getByText(/Click any account to sign in automatically/)).toBeInTheDocument();
  });

  it("shows role badges and org names", async () => {
    const { default: Page } = await import("@/app/(public)/test-accounts/page");
    render(<Page />);
    expect(screen.getAllByText("Super Admin").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Client Admin").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Harborview Health Systems").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Summit Financial Advisors").length).toBeGreaterThan(0);
  });

  it("marks pending and suspended accounts", async () => {
    const { default: Page } = await import("@/app/(public)/test-accounts/page");
    render(<Page />);
    expect(screen.getAllByText("pending").length).toBe(2);
    expect(screen.getByText("suspended")).toBeInTheDocument();
  });

  it("signs in with the shared password and routes to the redirect target", async () => {
    const { default: Page } = await import("@/app/(public)/test-accounts/page");
    render(<Page />);

    fireEvent.click(screen.getByText("Marcus Chen"));

    await waitFor(() => {
      expect(mockTestLoginAction).toHaveBeenCalledWith("marcus.chen@harborview.example", "1");
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/portal/dashboard");
    });
  });

  it("routes admins to /admin when the action resolves there", async () => {
    mockTestLoginAction.mockResolvedValue({ ok: true, redirectTo: "/admin" });
    const { default: Page } = await import("@/app/(public)/test-accounts/page");
    render(<Page />);

    fireEvent.click(screen.getByText("Aisha Johnson"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin");
    });
  });

  it("shows the error message when sign-in fails", async () => {
    mockTestLoginAction.mockResolvedValue({
      ok: false,
      error: "Invalid credentials",
    });
    const { default: Page } = await import("@/app/(public)/test-accounts/page");
    render(<Page />);

    fireEvent.click(screen.getByText("Marcus Chen"));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("links back to login", async () => {
    const { default: Page } = await import("@/app/(public)/test-accounts/page");
    render(<Page />);
    const backLink = screen.getByText("Back to login").closest("a");
    expect(backLink).toHaveAttribute("href", "/login");
  });
});
