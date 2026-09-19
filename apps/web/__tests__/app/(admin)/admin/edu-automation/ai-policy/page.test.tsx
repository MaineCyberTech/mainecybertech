import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

jest.mock("@/lib/module-actions", () => ({}));

const mockList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    eduAutomation: { aiPolicy: { list: mockList } },
  }),
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

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("AiPolicyPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/ai-policy/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "AI Policy" })).toBeInTheDocument();
    expect(screen.getByText(/AI usage policies/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/ai-policy/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("edu-automation");
  });

  it("renders empty state when no items", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/ai-policy/page")).default;
    render(await Page());
    expect(screen.getByText("No AI policies")).toBeInTheDocument();
  });

  it("renders items list when items exist", async () => {
    mockList.mockResolvedValue({
      items: [
        { id: "a1", title: "ChatGPT Usage Policy" },
        { id: "a2", title: "Data Sharing Policy" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/edu-automation/ai-policy/page")).default;
    render(await Page());
    expect(screen.getByText("ChatGPT Usage Policy")).toBeInTheDocument();
    expect(screen.getByText("Data Sharing Policy")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/ai-policy/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/edu-automation/ai-policy/page")).default;
    render(await Page());
    expect(screen.getByText("No AI policies")).toBeInTheDocument();
  });
});
