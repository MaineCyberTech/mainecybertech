import { render, screen } from "@testing-library/react";
import ServiceFinderQuiz from "@/components/store/ServiceFinderQuiz";
import { getQuizQuestions } from "@/lib/catalog/loader";

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock("@/components/store/StoreProductCard", () => {
  return function MockCard({ name }: { name: string }) {
    return <div data-testid="product-card">{name}</div>;
  };
});

const questions = getQuizQuestions();

describe("ServiceFinderQuiz", () => {
  it("renders first question", () => {
    render(<ServiceFinderQuiz questions={questions} />);
    expect(screen.getByText("What are you trying to improve first?")).toBeInTheDocument();
  });

  it("shows progress indicator", () => {
    render(<ServiceFinderQuiz questions={questions} />);
    expect(screen.getByText(/Question 1 of 6/)).toBeInTheDocument();
  });

  it('has "Next" button', () => {
    render(<ServiceFinderQuiz questions={questions} />);
    expect(screen.getByText("Next →")).toBeInTheDocument();
  });
});
