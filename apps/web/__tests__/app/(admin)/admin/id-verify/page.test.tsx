import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockIdVerifyList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    securitySuite: { idVerify: { list: mockIdVerifyList } },
  }),
}));

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mocks.requireAdminAccess(...args),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock("@/components/Breadcrumbs", () => {
  return function MockBreadcrumbs({ items }: any) {
    return <nav data-testid="breadcrumbs">{items.length} items</nav>;
  };
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: any) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

jest.mock("@/components/EmptyState", () => {
  return function MockEmptyState({ title, description }: any) {
    return (
      <div data-testid="empty-state">
        <p>{title}</p>
        <p>{description}</p>
      </div>
    );
  };
});

jest.mock("@/components/admin/CrudForm", () => {
  return function MockCrudForm({ title }: any) {
    return <div data-testid="crud-form">{title}</div>;
  };
});

jest.mock("@/lib/module-actions", () => ({
  createIdVerify: jest.fn(),
}));

describe("AdminIdVerifyPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockIdVerifyList.mockResolvedValue({ items: [] });
  });

  it("renders page shell with title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/id-verify/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Identity Verification Anti-Vishing" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Verify requestor identity/)).toBeInTheDocument();
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/id-verify/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("id-verify");
  });

  it("shows empty state when no verifications", async () => {
    const Page = (await import("@/app/(admin)/admin/id-verify/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No verifications")).toBeInTheDocument();
  });

  it("renders crud form for new verification", async () => {
    const Page = (await import("@/app/(admin)/admin/id-verify/page")).default;
    render(await Page());
    expect(screen.getByTestId("crud-form")).toHaveTextContent("New ID Verification");
  });

  it("renders verification items with status", async () => {
    mockIdVerifyList.mockResolvedValue({
      items: [
        {
          id: "v1",
          requestor_name: "Jane Doe",
          verification_method: "photo-id",
          verification_pass: true,
          status: "verified",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/id-verify/page")).default;
    render(await Page());
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("PASSED")).toBeInTheDocument();
  });
});
