import { render, screen } from "@testing-library/react";
import React from "react";

import DataErrorNote from "@/components/admin/DataErrorNote";

describe("DataErrorNote", () => {
  it("tells the operator the data could not be loaded", () => {
    render(<DataErrorNote what="assets" />);
    expect(screen.getByRole("status")).toHaveTextContent(/could not load assets/i);
  });

  it("renders an optional detail", () => {
    render(<DataErrorNote what="findings" detail="HTTP 500" />);
    expect(screen.getByText("HTTP 500")).toBeInTheDocument();
  });
});
