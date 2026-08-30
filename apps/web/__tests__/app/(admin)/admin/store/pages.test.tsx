import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

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

jest.mock("@/components/admin/AdminPageShell", () => {
  return function MockShell({ title, description, actions, children }: any) {
    return (
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {actions && <div>{actions}</div>}
        {children}
      </div>
    );
  };
});

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireAdminAccess.mockResolvedValue(undefined);
});

describe("AdminStoreFAQsPage", () => {
  it("renders page with FAQ count", async () => {
    const Page = (await import("@/app/(admin)/admin/store/faqs/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "FAQ Management" })).toBeInTheDocument();
    expect(screen.getAllByText(/starter FAQs/i).length).toBeGreaterThanOrEqual(1);
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/store/faqs/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders disabled manage button", async () => {
    const Page = (await import("@/app/(admin)/admin/store/faqs/page")).default;
    render(await Page());
    const btn = screen.getByRole("button", { name: /manage faqs/i });
    expect(btn).toBeDisabled();
  });
});

describe("AdminStoreCaseStudiesPage", () => {
  it("renders page with case study counts", async () => {
    const Page = (await import("@/app/(admin)/admin/store/case-studies/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Case Study Management" })).toBeInTheDocument();
  });

  it("renders disabled generate button", async () => {
    const Page = (await import("@/app/(admin)/admin/store/case-studies/page")).default;
    render(await Page());
    const btn = screen.getByRole("button", { name: /generate case study/i });
    expect(btn).toBeDisabled();
  });
});

describe("AdminStoreNurturePage", () => {
  it("renders page with nurture sequence count", async () => {
    const Page = (await import("@/app/(admin)/admin/store/nurture/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Email Nurture Sequences" })).toBeInTheDocument();
    expect(screen.getAllByText(/nurture sequence/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders disabled create button", async () => {
    const Page = (await import("@/app/(admin)/admin/store/nurture/page")).default;
    render(await Page());
    const btn = screen.getByRole("button", { name: /create nurture sequence/i });
    expect(btn).toBeDisabled();
  });
});

describe("AdminStoreOperationsPage", () => {
  it("renders page with entity count", async () => {
    const Page = (await import("@/app/(admin)/admin/store/operations/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Intake-to-Project Operations" })).toBeInTheDocument();
    expect(screen.getByText(/entity types/i)).toBeInTheDocument();
  });

  it("renders disabled convert button", async () => {
    const Page = (await import("@/app/(admin)/admin/store/operations/page")).default;
    render(await Page());
    const btn = screen.getByRole("button", { name: /convert to project/i });
    expect(btn).toBeDisabled();
  });
});

describe("AdminStoreLifecyclePage", () => {
  it("renders page with lifecycle state count", async () => {
    const Page = (await import("@/app/(admin)/admin/store/lifecycle/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Product Lifecycle Workflow" })).toBeInTheDocument();
    expect(screen.getAllByText(/lifecycle states/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders lifecycle state pills", async () => {
    const Page = (await import("@/app/(admin)/admin/store/lifecycle/page")).default;
    render(await Page());
    expect(screen.getByText(/needs update/i)).toBeInTheDocument();
  });

  it("renders disabled review button", async () => {
    const Page = (await import("@/app/(admin)/admin/store/lifecycle/page")).default;
    render(await Page());
    const btn = screen.getByRole("button", { name: /review lifecycle/i });
    expect(btn).toBeDisabled();
  });
});
