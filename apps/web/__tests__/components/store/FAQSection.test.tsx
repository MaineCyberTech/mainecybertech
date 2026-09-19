import { render, screen } from "@testing-library/react";
import FAQSection from "@/components/store/FAQSection";

describe("FAQSection", () => {
  it("renders FAQ questions (defaults to first 3 FAQs)", () => {
    render(<FAQSection />);
    expect(screen.getByText("What if I do not know my admin login?")).toBeInTheDocument();
    expect(screen.getByText("Does this include hardware?")).toBeInTheDocument();
    expect(screen.getByText("Is this remote or onsite?")).toBeInTheDocument();
  });

  it("renders FAQ answers", () => {
    render(<FAQSection />);
    expect(
      screen.getByText(/Maine Cyber Tech can help identify the right account owner/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Hardware, licenses, subscriptions, and third-party fees/),
    ).toBeInTheDocument();
  });

  it("renders Frequently Asked Questions heading", () => {
    render(<FAQSection />);
    expect(screen.getByText("Frequently Asked")).toBeInTheDocument();
    expect(screen.getByText("Questions")).toBeInTheDocument();
  });

  it("renders each FAQ as a details element", () => {
    const { container } = render(<FAQSection />);
    const details = container.querySelectorAll("details");
    expect(details.length).toBeGreaterThanOrEqual(3);
  });
});
