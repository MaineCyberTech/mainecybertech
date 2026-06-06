import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";

describe("AvatarPill", () => {
  it("renders initials from a two-word name", async () => {
    const { default: AvatarPill } = await import(
      "@/components/admin/AvatarPill"
    );
    render(<AvatarPill name="Alice Smith" />);

    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("renders first initial for single-word name", async () => {
    const { default: AvatarPill } = await import(
      "@/components/admin/AvatarPill"
    );
    render(<AvatarPill name="Alice" />);

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders question mark when name is null", async () => {
    const { default: AvatarPill } = await import(
      "@/components/admin/AvatarPill"
    );
    render(<AvatarPill />);

    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("renders subtitle", async () => {
    const { default: AvatarPill } = await import(
      "@/components/admin/AvatarPill"
    );
    render(<AvatarPill name="Alice Smith" subtitle="alice@test.com" />);

    expect(screen.getByText("alice@test.com")).toBeInTheDocument();
  });

  it("renders 'Unknown' fallback for name display", async () => {
    const { default: AvatarPill } = await import(
      "@/components/admin/AvatarPill"
    );
    render(<AvatarPill />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("uses sm size class when size is sm", async () => {
    const { default: AvatarPill } = await import(
      "@/components/admin/AvatarPill"
    );
    const { container } = render(
      <AvatarPill name="Alice Smith" size="sm" />,
    );

    const circle = container.querySelector(".h-8");
    expect(circle).toBeInTheDocument();
  });

  it("uses md size class by default", async () => {
    const { default: AvatarPill } = await import(
      "@/components/admin/AvatarPill"
    );
    const { container } = render(<AvatarPill name="Alice Smith" />);

    const circle = container.querySelector(".h-10");
    expect(circle).toBeInTheDocument();
  });
});
