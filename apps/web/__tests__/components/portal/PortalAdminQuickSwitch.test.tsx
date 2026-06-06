import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockRequireAdminAccess = jest.fn();

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: mockRequireAdminAccess,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

describe("PortalAdminQuickSwitch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders admin link when user is admin", async () => {
    mockRequireAdminAccess.mockResolvedValue({
      userId: "user-1",
      roleKey: "admin",
    });

    const { default: PortalAdminQuickSwitch } = await import(
      "@/components/portal/PortalAdminQuickSwitch"
    );
    const element = await PortalAdminQuickSwitch();
    render(element);

    const link = screen.getByRole("link", { name: /open admin/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/admin");
  });

  it("returns null when user is not admin", async () => {
    mockRequireAdminAccess.mockRejectedValue(new Error("Not admin"));

    const { default: PortalAdminQuickSwitch } = await import(
      "@/components/portal/PortalAdminQuickSwitch"
    );
    const element = await PortalAdminQuickSwitch();

    expect(element).toBeNull();
  });
});
