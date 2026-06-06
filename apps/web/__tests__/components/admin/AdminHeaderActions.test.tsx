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

describe("AdminHeaderActions", () => {
  let AdminHeaderActions: typeof import("@/components/admin/AdminHeaderActions").default;

  beforeAll(async () => {
    AdminHeaderActions = (await import("@/components/admin/AdminHeaderActions")).default;
  });

  it("renders client portal link", async () => {
    render(await AdminHeaderActions());
    const link = screen.getByText("Client Portal").closest("a");
    expect(link).toHaveAttribute("href", "/portal/dashboard");
  });

  it("renders sign out button", async () => {
    render(await AdminHeaderActions());
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument();
  });

  it("sign out button submits logoutAction", async () => {
    render(await AdminHeaderActions());
    const form = screen.getByRole("button", { name: "Sign Out" }).closest("form");
    expect(form).toHaveAttribute("action");
  });
});
