import { render, screen } from "@testing-library/react";

const mockListCampaigns = jest.fn();
const mockRequireAdminAccess = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({ store: { listCampaigns: mockListCampaigns } }),
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

const campaign = {
  id: "c-1",
  slug: "marina-preseason",
  name: "Marina Pre-Season Readiness",
  audience: "Marinas",
  headline: "Get ready before the season",
  body: "",
  icon: "Anchor",
  accent: "teal",
  recommendedProductIds: [],
  trustBadges: [],
  promoEligibility: [],
  status: "active",
  startsAt: null,
  endsAt: null,
  capacityEnabled: true,
  capacityTotal: 10,
  capacityRemaining: 4,
  capacityLabel: "",
  capacityNotice: "4 of 10 spots left",
  organizationId: null,
  createdAt: "2026-09-21T10:00:00.000Z",
  updatedAt: "2026-09-21T10:00:00.000Z",
};

describe("AdminCampaignsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListCampaigns.mockResolvedValue([]);
  });

  it("renders the page and calls the admin gate", async () => {
    const Page = (await import("@/app/(admin)/admin/store/campaigns/page")).default;

    render(await Page());

    expect(mockRequireAdminAccess).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: /seasonal campaigns/i })).toBeInTheDocument();
  });

  it("shows an empty state with no campaigns", async () => {
    const Page = (await import("@/app/(admin)/admin/store/campaigns/page")).default;

    render(await Page());

    expect(screen.getByText(/no campaigns yet/i)).toBeInTheDocument();
  });

  it("shows the truthful capacity notice that will be displayed", async () => {
    mockListCampaigns.mockResolvedValue([campaign]);
    const Page = (await import("@/app/(admin)/admin/store/campaigns/page")).default;

    render(await Page());

    expect(screen.getByText(/4 of 10 remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/Shows: “4 of 10 spots left”/)).toBeInTheDocument();
    expect(screen.getByLabelText(/campaign status/i)).toBeInTheDocument();
  });

  it("warns when capacity messaging is enabled but would not be shown", async () => {
    mockListCampaigns.mockResolvedValue([
      { ...campaign, capacityRemaining: 0, capacityNotice: null },
    ]);
    const Page = (await import("@/app/(admin)/admin/store/campaigns/page")).default;

    render(await Page());

    expect(screen.getByText(/No notice will be shown/i)).toBeInTheDocument();
  });

  it("surfaces a load failure", async () => {
    mockListCampaigns.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/store/campaigns/page")).default;

    render(await Page());

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
