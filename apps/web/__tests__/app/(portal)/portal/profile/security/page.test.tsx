import { render, screen } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/ToastProvider";

const mockMfaFactors = jest.fn();
const mockMfaRecoveryCodes = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    auth: {
      mfaFactors: (...args: unknown[]) => mockMfaFactors(...args),
      mfaRecoveryCodes: (...args: unknown[]) => mockMfaRecoveryCodes(...args),
    },
  }),
}));

jest.mock("@/components/Breadcrumbs", () => ({
  __esModule: true,
  default: () => <nav aria-label="Breadcrumb" />,
}));

jest.mock("@/components/portal/PortalSubnav", () => ({
  __esModule: true,
  default: () => <nav data-testid="subnav" />,
}));

async function renderPage(searchParams: { recovered?: string } = {}) {
  const Page = (await import("@/app/(portal)/portal/profile/security/page")).default;
  return render(
    <ToastProvider>{await Page({ searchParams: Promise.resolve(searchParams) })}</ToastProvider>,
  );
}

describe("SecurityPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMfaFactors.mockResolvedValue({ totp: [] });
    mockMfaRecoveryCodes.mockResolvedValue({
      remaining: 0,
      total: 10,
      lastGeneratedAt: null,
    });
  });

  it("renders the security settings when loading succeeds", async () => {
    await renderPage();

    expect(screen.getByRole("heading", { name: "Security" })).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toBeInTheDocument();
  });

  it("exposes the load error as an alert", async () => {
    mockMfaFactors.mockRejectedValue(new Error("API down"));

    await renderPage();

    const alert = screen
      .getAllByRole("alert")
      .find((element) => element.textContent?.includes("Unable to load security settings."));
    expect(alert).toBeTruthy();
  });
});
