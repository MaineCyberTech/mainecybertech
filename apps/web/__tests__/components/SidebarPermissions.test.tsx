import { render, screen } from "@testing-library/react";
import AdminSidebarContent from "@/components/admin/AdminSidebarContent";
import PortalSidebarContent from "@/components/portal/PortalSidebarContent";

const mockPathname = jest.fn(() => "/admin");
const mockCan = jest.fn();
const mockLoading = jest.fn(() => false);
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));
jest.mock("@/lib/use-permissions", () => ({
  usePermissions: () => ({
    can: (...args: any[]) => mockCan(...args),
    loading: mockLoading(),
  }),
}));

describe("AdminSidebarContent permission filtering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue("/admin");
    mockLoading.mockReturnValue(false);
    mockCan.mockReturnValue(false);
  });

  it("shows a loading skeleton while permissions load", () => {
    mockLoading.mockReturnValue(true);
    render(<AdminSidebarContent />);
    expect(document.querySelector(".animate-pulse")).not.toBeNull();
  });

  it("hides groups with no permitted items", () => {
    render(<AdminSidebarContent />);
    // No nav links rendered when every permission is denied
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("only renders nav items the user can view", () => {
    mockCan.mockImplementation((module: string) => module === "tickets" || module === "dashboard");
    render(<AdminSidebarContent />);
    const links = screen.getAllByRole("link").map((l) => l.textContent);
    expect(links).toContain("Tickets");
    expect(links).toContain("Overview");
    expect(links).not.toContain("Users");
    expect(links).not.toContain("Organizations");
  });
});

describe("PortalSidebarContent permission filtering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue("/portal/dashboard");
    mockLoading.mockReturnValue(false);
    mockCan.mockReturnValue(false);
  });

  it("only renders portal nav items the user can view", () => {
    mockCan.mockImplementation((module: string) =>
      ["dashboard", "tickets", "projects"].includes(module),
    );
    render(<PortalSidebarContent />);
    const links = screen.getAllByRole("link").map((l) => l.textContent);
    expect(links).toContain("Dashboard");
    expect(links).toContain("Support");
    expect(links).toContain("Projects");
    expect(links).not.toContain("Billing");
    expect(links).not.toContain("Assets");
  });

  it("hides everything when no permissions are granted", () => {
    render(<PortalSidebarContent />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
