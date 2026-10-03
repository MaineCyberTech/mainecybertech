import { render, screen } from "@testing-library/react";
import React from "react";

import LinkedRunbook from "@/components/runbooks/LinkedRunbook";

describe("LinkedRunbook", () => {
  it("renders nothing when no runbook is linked", () => {
    const { container } = render(<LinkedRunbook runbook={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the linked runbook procedure", () => {
    render(
      <LinkedRunbook
        runbook={{
          title: "Ransomware response",
          category: "Security",
          version: "2.0",
          content: "Step 1: isolate\nStep 2: notify",
        }}
      />,
    );

    expect(screen.getByText(/Ransomware response/)).toBeInTheDocument();
    expect(screen.getByText(/Step 1: isolate/)).toBeInTheDocument();
  });

  it("shows a placeholder when the runbook has no content", () => {
    render(<LinkedRunbook runbook={{ title: "Empty runbook", content: null }} />);
    expect(screen.getByText(/no procedure content published/i)).toBeInTheDocument();
  });
});
