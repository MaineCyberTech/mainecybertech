import { render, screen, fireEvent } from "@testing-library/react";
import ServiceFinderQuiz from "@/components/store/ServiceFinderQuiz";
import { getQuizQuestions } from "@/lib/catalog/loader";

const mockTrack = jest.fn();

jest.mock("@/lib/catalog/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

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
  beforeEach(() => jest.clearAllMocks());

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

  it("tracks quiz_complete on the last step [AN-P2-003]", () => {
    render(<ServiceFinderQuiz questions={questions} />);

    questions.forEach((question, index) => {
      fireEvent.click(screen.getByText(question.options[0].label));
      fireEvent.click(
        screen.getByText(index === questions.length - 1 ? "See Results →" : "Next →"),
      );
    });

    expect(mockTrack).toHaveBeenCalledWith("quiz_complete", { page: "/store/quiz" });
  });
});
