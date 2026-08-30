import { render, screen } from "@testing-library/react";
import TrustBadgeList from "@/components/store/TrustBadgeList";

describe("TrustBadgeList", () => {
  it("renders badges for intake_form surface (has required no_secret_intake)", () => {
    render(<TrustBadgeList surface="intake_form" />);
    expect(screen.getByText("No-secret intake")).toBeInTheDocument();
  });

  it("returns null for unknown surface", () => {
    const { container } = render(<TrustBadgeList surface="unknown_surface" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders consult badge for sensitive_service with elevated risk", () => {
    render(<TrustBadgeList surface="sensitive_service" riskLevel="elevated" />);
    expect(screen.getByText("Consult required for sensitive work")).toBeInTheDocument();
  });
});
