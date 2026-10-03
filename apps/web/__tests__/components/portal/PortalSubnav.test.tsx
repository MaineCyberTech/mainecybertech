import { render, screen } from "@testing-library/react";

jest.mock("@/lib/use-permissions", () => ({
  usePermissions: () => ({ loading: false, can: () => true }),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/portal/assets",
}));

describe("PortalSubnav", () => {
  it("renders sibling tabs for the current section", async () => {
    const { default: PortalSubnav } = await import("@/components/portal/PortalSubnav");
    render(<PortalSubnav current="assets" />);
    expect(screen.getByRole("navigation", { name: /operations section/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Assets" })).toHaveAttribute("aria-current", "page");
  });

  it("renders nothing for an unknown section key", async () => {
    const { default: PortalSubnav } = await import("@/components/portal/PortalSubnav");
    const { container } = render(<PortalSubnav current="does-not-exist" />);
    expect(container.innerHTML).toBe("");
  });
});
