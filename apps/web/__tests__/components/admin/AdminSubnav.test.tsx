import { render, screen } from "@testing-library/react";

jest.mock("@/lib/use-permissions", () => ({
  usePermissions: () => ({ loading: false, can: () => true }),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/assets",
}));

describe("AdminSubnav", () => {
  it("renders sibling tabs for the current section", async () => {
    const { default: AdminSubnav } = await import("@/components/admin/AdminSubnav");
    render(<AdminSubnav current="assets" />);
    expect(screen.getByRole("navigation", { name: /operations section/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Assets" })).toHaveAttribute("aria-current", "page");
  });

  it("renders nothing for an unknown section key", async () => {
    const { default: AdminSubnav } = await import("@/components/admin/AdminSubnav");
    const { container } = render(<AdminSubnav current="does-not-exist" />);
    expect(container.innerHTML).toBe("");
  });
});
