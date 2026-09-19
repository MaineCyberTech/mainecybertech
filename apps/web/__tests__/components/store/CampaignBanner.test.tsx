import { render, screen } from "@testing-library/react";
import CampaignBanner from "@/components/store/CampaignBanner";

describe("CampaignBanner", () => {
  it("renders campaign names (first 2 campaigns)", () => {
    render(<CampaignBanner />);
    expect(screen.getByText("Marina Pre-Season Readiness")).toBeInTheDocument();
    expect(screen.getByText("Church / Nonprofit Cyber Checkup")).toBeInTheDocument();
  });

  it("shows audience info for both campaigns", () => {
    render(<CampaignBanner />);
    expect(
      screen.getByText("Marinas, boatyards, outdoor storage, and seasonal waterfront businesses"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Churches, nonprofits, community organizations, and volunteer-led teams"),
    ).toBeInTheDocument();
  });

  it("renders headlines for both campaigns", () => {
    render(<CampaignBanner />);
    expect(screen.getByText(/Get Wi-Fi, cameras, guest access/)).toBeInTheDocument();
    expect(screen.getByText(/Protect email, volunteers, giving platforms/)).toBeInTheDocument();
  });

  it("shows Seasonal Focus badge", () => {
    render(<CampaignBanner />);
    expect(screen.getByText("Seasonal Focus")).toBeInTheDocument();
  });

  it("renders Learn More links", () => {
    render(<CampaignBanner />);
    const links = screen.getAllByText("Learn More");
    expect(links).toHaveLength(2);
  });
});
