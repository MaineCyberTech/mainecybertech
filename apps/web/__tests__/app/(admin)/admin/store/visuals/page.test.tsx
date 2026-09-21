import { render, screen } from "@testing-library/react";

const mockListVisualAssets = jest.fn();
const mockRequireAdminAccess = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({ store: { listVisualAssets: mockListVisualAssets } }),
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

const asset = {
  id: "va-1",
  linkedEntityType: "category",
  linkedEntityId: "cybersecurity",
  assetType: "icon",
  iconName: "shield",
  accentColor: "#059669",
  imageUrl: "",
  altText: "Cybersecurity",
  decorative: false,
  provenance: "internal",
  licenseNotes: "",
  createdAt: "2026-09-21T10:00:00.000Z",
  updatedAt: "2026-09-21T10:00:00.000Z",
};

describe("AdminVisualsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListVisualAssets.mockResolvedValue([]);
  });

  it("renders the page and calls the admin gate", async () => {
    const Page = (await import("@/app/(admin)/admin/store/visuals/page")).default;

    render(await Page());

    expect(mockRequireAdminAccess).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: /visual asset manager/i })).toBeInTheDocument();
  });

  it("shows an empty state when no visual assets are linked", async () => {
    const Page = (await import("@/app/(admin)/admin/store/visuals/page")).default;

    render(await Page());

    expect(screen.getByText(/no linked visual assets/i)).toBeInTheDocument();
  });

  it("renders linked visual assets from the API", async () => {
    mockListVisualAssets.mockResolvedValue([asset]);
    const Page = (await import("@/app/(admin)/admin/store/visuals/page")).default;

    render(await Page());

    expect(screen.getByText("cybersecurity")).toBeInTheDocument();
    expect(screen.getByText("shield")).toBeInTheDocument();
    expect(screen.getAllByText("Cybersecurity").length).toBeGreaterThan(0);
  });

  it("surfaces a load failure", async () => {
    mockListVisualAssets.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/store/visuals/page")).default;

    render(await Page());

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
