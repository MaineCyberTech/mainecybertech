import { render, screen } from "@testing-library/react";
import BundleValuePanel from "@/components/store/BundleValuePanel";

const PROPS = {
  includedValueText:
    "Combines the most common first-step reviews into one practical technology baseline.",
  assumptions: ["Final pricing depends on user count, admin access, and systems included."],
  disclaimer:
    "Displayed value is informational and not a guaranteed discount unless an active promotion applies.",
};

describe("BundleValuePanel", () => {
  it("renders included value text", () => {
    render(<BundleValuePanel {...PROPS} />);
    expect(screen.getByText(PROPS.includedValueText)).toBeInTheDocument();
  });

  it("renders assumptions list", () => {
    render(<BundleValuePanel {...PROPS} />);
    for (const a of PROPS.assumptions) {
      expect(screen.getByText(a)).toBeInTheDocument();
    }
  });

  it("renders disclaimer", () => {
    render(<BundleValuePanel {...PROPS} />);
    expect(screen.getByText(PROPS.disclaimer)).toBeInTheDocument();
  });
});
