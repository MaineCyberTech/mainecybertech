import { render, screen } from "@testing-library/react";

describe("PortalSubnav", () => {
  it("renders null (navigation moved to PortalSidebarLayout)", async () => {
    const { default: PortalSubnav } = await import(
      "@/components/portal/PortalSubnav"
    );
    const { container } = render(<PortalSubnav current="dashboard" />);
    expect(container.innerHTML).toBe("");
  });
});
