import { render, screen } from "@testing-library/react";
import RouteGuard from "@/components/RouteGuard";

const mockPathname = jest.fn(() => "/admin/users");
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

const RULES: Record<string, { module: string; action?: string }> = {
  "/admin/users": { module: "users" },
  "/admin/organizations": { module: "organizations", action: "view" },
};

describe("RouteGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue("/admin/users");
    mockCan.mockReturnValue(true);
    mockLoading.mockReturnValue(false);
  });

  it("renders children when permission is granted", () => {
    render(
      <RouteGuard rules={RULES} homeHref="/admin">
        <div>secret content</div>
      </RouteGuard>,
    );
    expect(screen.getByText("secret content")).toBeInTheDocument();
    expect(screen.queryByText("403")).not.toBeInTheDocument();
  });

  it("renders 403 panel when permission is denied", () => {
    mockCan.mockReturnValue(false);
    render(
      <RouteGuard rules={RULES} homeHref="/admin">
        <div>secret content</div>
      </RouteGuard>,
    );
    expect(screen.getByText("403")).toBeInTheDocument();
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(screen.queryByText("secret content")).not.toBeInTheDocument();
  });

  it("renders children while permissions are still loading", () => {
    mockLoading.mockReturnValue(true);
    mockCan.mockReturnValue(false);
    render(
      <RouteGuard rules={RULES} homeHref="/admin">
        <div>secret content</div>
      </RouteGuard>,
    );
    expect(screen.getByText("secret content")).toBeInTheDocument();
  });

  it("does not gate unmatched routes", () => {
    mockPathname.mockReturnValue("/admin/other-page");
    mockCan.mockReturnValue(false);
    render(
      <RouteGuard rules={RULES} homeHref="/admin">
        <div>secret content</div>
      </RouteGuard>,
    );
    expect(screen.getByText("secret content")).toBeInTheDocument();
  });
});
