import { render, screen } from "@testing-library/react";

describe("AdminSubnav", () => {
  it("renders null (navigation moved to AdminSidebarLayout)", async () => {
    const { default: AdminSubnav } = await import(
      "@/components/admin/AdminSubnav"
    );
    const { container } = render(<AdminSubnav current="home" />);
    expect(container.innerHTML).toBe("");
  });
});
