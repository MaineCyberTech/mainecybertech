import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockDmarcCoachList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    dmarcCoach: { list: mockDmarcCoachList },
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

describe("DmarcCoachPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockDmarcCoachList.mockResolvedValue({ items: [] });
  });

  it("renders page shell with heading 'DMARC Coach'", async () => {
    const Page = (await import("@/app/(admin)/admin/dmarc-coach/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "DMARC Coach" })).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/dmarc-coach/page")).default;
    render(await Page());
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs", async () => {
    const Page = (await import("@/app/(admin)/admin/dmarc-coach/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
  });

  it("shows 'Analyze Domain' button", async () => {
    const Page = (await import("@/app/(admin)/admin/dmarc-coach/page")).default;
    render(await Page());
    expect(screen.getAllByText("Analyze Domain").length).toBeGreaterThanOrEqual(2);
  });

  it("shows empty state when no items", async () => {
    const Page = (await import("@/app/(admin)/admin/dmarc-coach/page")).default;
    render(await Page());
    expect(screen.getByText("No domains analyzed yet")).toBeInTheDocument();
  });

  it("renders list items with domain name and grade when data exists", async () => {
    mockDmarcCoachList.mockResolvedValue({
      items: [
        {
          id: "1",
          domain: "example.com",
          overall_grade: "A+",
          dmarc_record: "v=DMARC1; p=reject; rua=mailto:dmarc@example.com",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/dmarc-coach/page")).default;
    render(await Page());
    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(screen.getByText("A+")).toBeInTheDocument();
  });
});
