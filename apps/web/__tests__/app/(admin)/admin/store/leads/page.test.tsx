import { render, screen } from "@testing-library/react";

const mockListLeads = jest.fn();
const mockRequireAdminAccess = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({ store: { listLeads: mockListLeads } }),
}));

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: () => mockRequireAdminAccess(),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("AdminStoreLeadsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListLeads.mockResolvedValue([]);
  });

  it("renders the scoring reference", async () => {
    const Page = (await import("@/app/(admin)/admin/store/leads/page")).default;

    render(await Page());

    expect(mockRequireAdminAccess).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: /lead scoring engine/i })).toBeInTheDocument();
    expect(screen.getAllByText(/scoring rules/i).length).toBeGreaterThan(0);
  });

  it("shows an empty state when there are no scored leads", async () => {
    const Page = (await import("@/app/(admin)/admin/store/leads/page")).default;

    render(await Page());

    expect(screen.getByText(/no scored leads yet/i)).toBeInTheDocument();
  });

  it("renders scored leads from the API", async () => {
    mockListLeads.mockResolvedValue([
      {
        id: "lead-1",
        quote_request_id: "qr-1",
        status: "new",
        lead_score: 85,
        lead_band: "priority",
        score_breakdown: [
          { rule: "emergency_selected", label: "Emergency service selected", points: 30 },
        ],
        assigned_owner: null,
        follow_up_due_at: "2026-09-22T10:00:00.000Z",
        created_at: "2026-09-21T10:00:00.000Z",
        updated_at: "2026-09-21T10:00:00.000Z",
      },
    ]);
    const Page = (await import("@/app/(admin)/admin/store/leads/page")).default;

    render(await Page());

    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getAllByText("priority").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Emergency service selected/).length).toBeGreaterThan(0);
  });

  it("surfaces a load failure", async () => {
    mockListLeads.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/store/leads/page")).default;

    render(await Page());

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
