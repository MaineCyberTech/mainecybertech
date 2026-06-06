import { render, screen } from "@testing-library/react";

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

describe("PortalHeaderActions", () => {
  let PortalHeaderActions: typeof import("@/components/portal/PortalHeaderActions").default;

  beforeAll(async () => {
    PortalHeaderActions = (await import("@/components/portal/PortalHeaderActions")).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders admin portal link when user is admin", async () => {
    mockRequireAdminAccess.mockResolvedValue(undefined);
    render(await PortalHeaderActions());
    const link = screen.getByText("Admin Portal").closest("a");
    expect(link).toHaveAttribute("href", "/admin");
  });

  it("does not render admin portal link when user is not admin", async () => {
    mockRequireAdminAccess.mockRejectedValue(new Error("not admin"));
    render(await PortalHeaderActions());
    expect(screen.queryByText("Admin Portal")).not.toBeInTheDocument();
  });

  it("renders sign out button", async () => {
    mockRequireAdminAccess.mockRejectedValue(new Error("not admin"));
    render(await PortalHeaderActions());
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument();
  });

  it("sign out form has logoutAction", async () => {
    mockRequireAdminAccess.mockRejectedValue(new Error("not admin"));
    render(await PortalHeaderActions());
    const form = screen.getByRole("button", { name: "Sign Out" }).closest("form");
    expect(form).toHaveAttribute("action");
  });
});
