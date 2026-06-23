import { render, screen } from "@testing-library/react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

const mockLogoutAction = jest.fn();
jest.mock("@/lib/auth/auth-actions", () => ({
  logoutAction: (...args: any[]) => mockLogoutAction(...args),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

// Local ThemeProvider for tests
type Theme = "light" | "dark" | "system";
interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const TestThemeContext = createContext<ThemeContextType | undefined>(undefined);

function TestThemeProvider({
  children,
  defaultTheme = "dark",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  const resolveTheme = useCallback((t: Theme): "light" | "dark" => {
    if (t === "system") {
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      return "dark";
    }
    return t;
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
  }, [theme, mounted, resolveTheme]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <TestThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </TestThemeContext.Provider>
  );
}

// Mock only the ThemeProvider from @mct/ui
jest.mock("@mct/ui/providers/ThemeProvider", () => ({
  ThemeProvider: TestThemeProvider,
}));

describe("PortalHeaderActions", () => {
  let PortalHeaderActions: typeof import("@/components/portal/PortalHeaderActions").default;

  beforeAll(async () => {
    PortalHeaderActions = (
      await import("@/components/portal/PortalHeaderActions")
    ).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithTheme = async (component: React.ReactNode) => {
    return render(
      <TestThemeProvider defaultTheme="dark">{component}</TestThemeProvider>,
    );
  };

  it("renders admin portal link when user is admin", async () => {
    mockRequireAdminAccess.mockResolvedValue(undefined);
    await renderWithTheme(await PortalHeaderActions());
    const link = screen.getByText("Admin Portal").closest("a");
    expect(link).toHaveAttribute("href", "/admin");
  });

  it("does not render admin portal link when user is not admin", async () => {
    mockRequireAdminAccess.mockRejectedValue(new Error("not admin"));
    await renderWithTheme(await PortalHeaderActions());
    expect(screen.queryByText("Admin Portal")).not.toBeInTheDocument();
  });

  it("renders sign out button", async () => {
    mockRequireAdminAccess.mockRejectedValue(new Error("not admin"));
    await renderWithTheme(await PortalHeaderActions());
    expect(
      screen.getByRole("button", { name: "Sign Out" }),
    ).toBeInTheDocument();
  });

  it("sign out form has logoutAction", async () => {
    mockRequireAdminAccess.mockRejectedValue(new Error("not admin"));
    await renderWithTheme(await PortalHeaderActions());
    const form = screen
      .getByRole("button", { name: "Sign Out" })
      .closest("form");
    expect(form).toHaveAttribute("action");
  });
});
