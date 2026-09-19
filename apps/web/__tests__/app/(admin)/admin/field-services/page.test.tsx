import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockIspList = jest.fn();
const mockUnifiList = jest.fn();
const mockPortMapsList = jest.fn();
const mockCameraList = jest.fn();
const mockStagingList = jest.fn();
const mockNetworkDiagramsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    fieldServices: {
      isp: { list: mockIspList },
      unifi: { list: mockUnifiList },
      portMaps: { list: mockPortMapsList },
      camera: { list: mockCameraList },
      staging: { list: mockStagingList },
      networkDiagrams: { list: mockNetworkDiagramsList },
    },
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

describe("AdminFieldServicesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockIspList.mockResolvedValue({ total: 0 });
    mockUnifiList.mockResolvedValue({ total: 0 });
    mockPortMapsList.mockResolvedValue({ total: 0 });
    mockCameraList.mockResolvedValue({ total: 0 });
    mockStagingList.mockResolvedValue({ total: 0 });
    mockNetworkDiagramsList.mockResolvedValue({ total: 0 });
  });

  it("renders page shell with title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Field Services & Network Tools" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/ISP assessments, UniFi surveys/)).toBeInTheDocument();
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("field-services");
  });

  it("renders all 6 sub-module links", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/page")).default;
    render(await Page());
    expect(screen.getByText("ISP")).toBeInTheDocument();
    expect(screen.getByText("UniFi")).toBeInTheDocument();
    expect(screen.getByText("Port Maps")).toBeInTheDocument();
    expect(screen.getByText("Cameras")).toBeInTheDocument();
    expect(screen.getByText("Staging")).toBeInTheDocument();
    expect(screen.getByText("Diagrams")).toBeInTheDocument();
  });

  it("shows zero counts by default", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/page")).default;
    render(await Page());
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(6);
  });

  it("links each sub-module to its detail page", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/page")).default;
    render(await Page());
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/admin/field-services/isp")).toBe(true);
    expect(links.some((l) => l.getAttribute("href") === "/admin/field-services/unifi")).toBe(true);
    expect(links.some((l) => l.getAttribute("href") === "/admin/field-services/port-maps")).toBe(
      true,
    );
    expect(links.some((l) => l.getAttribute("href") === "/admin/field-services/camera-calc")).toBe(
      true,
    );
    expect(links.some((l) => l.getAttribute("href") === "/admin/field-services/staging")).toBe(
      true,
    );
    expect(
      links.some((l) => l.getAttribute("href") === "/admin/field-services/network-diagrams"),
    ).toBe(true);
  });
});
