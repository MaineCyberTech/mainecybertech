import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockTrainingHubCoursesList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    trainingHub: { courses: { list: mockTrainingHubCoursesList } },
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

describe("TrainingHubPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockTrainingHubCoursesList.mockResolvedValue({ items: [] });
  });

  it("renders page shell with heading 'Training Hub'", async () => {
    const Page = (await import("@/app/(admin)/admin/training-hub/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Training Hub" })).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/training-hub/page")).default;
    render(await Page());
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs", async () => {
    const Page = (await import("@/app/(admin)/admin/training-hub/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
  });

  it("does not show removed action buttons", async () => {
    const Page = (await import("@/app/(admin)/admin/training-hub/page")).default;
    render(await Page());
    expect(screen.queryByText("Create Course")).toBeNull();
  });

  it("shows empty state when no items", async () => {
    const Page = (await import("@/app/(admin)/admin/training-hub/page")).default;
    render(await Page());
    expect(screen.getByText("No courses created yet")).toBeInTheDocument();
  });

  it("renders list items with title and category when data exists", async () => {
    mockTrainingHubCoursesList.mockResolvedValue({
      items: [
        {
          id: "1",
          title: "Security 101",
          category: "Cybersecurity",
          difficulty: "Beginner",
          estimated_minutes: 45,
          status: "active",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/training-hub/page")).default;
    render(await Page());
    expect(screen.getByText("Security 101")).toBeInTheDocument();
    expect(screen.getByText(/Cybersecurity/)).toBeInTheDocument();
  });
});
