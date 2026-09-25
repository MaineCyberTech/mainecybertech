import { render, screen } from "@testing-library/react";

const publicStatus = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({ statusPage: { publicStatus } }),
}));

import PublicStatusPage from "@/app/(public)/status/[orgId]/page";

describe("PublicStatusPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders components and the all-operational banner", async () => {
    publicStatus.mockResolvedValue({
      components: [{ id: "c1", name: "API", status: "operational" }],
      activeIncidents: [],
      upcomingMaintenance: [],
    });

    render(await PublicStatusPage({ params: Promise.resolve({ orgId: "org-1" }) }));

    expect(screen.getByText("API")).toBeInTheDocument();
    expect(screen.getByText(/All systems operational/i)).toBeInTheDocument();
  });

  it("shows active incidents", async () => {
    publicStatus.mockResolvedValue({
      components: [],
      activeIncidents: [
        {
          id: "i1",
          title: "Elevated API errors",
          status: "investigating",
          started_at: new Date().toISOString(),
        },
      ],
      upcomingMaintenance: [],
    });

    render(await PublicStatusPage({ params: Promise.resolve({ orgId: "org-1" }) }));

    expect(screen.getByText("Elevated API errors")).toBeInTheDocument();
    expect(screen.getByText(/Active incidents or degraded/i)).toBeInTheDocument();
  });

  it("degrades gracefully when the API fails", async () => {
    publicStatus.mockRejectedValue(new Error("down"));
    render(await PublicStatusPage({ params: Promise.resolve({ orgId: "org-1" }) }));
    expect(screen.getByText(/No components reported/i)).toBeInTheDocument();
  });
});
