import { jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const mockPortalSearch = jest.fn();

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    search: { portal: mockPortalSearch },
  }),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

import PortalGlobalSearch from "@/components/portal/PortalGlobalSearch";

describe("PortalGlobalSearch", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the documents group returned by the portal API [SEARCH-P2-002]", async () => {
    mockPortalSearch.mockResolvedValue({
      tickets: [],
      projects: [],
      documents: [{ id: "doc-1", name: "Shared report", mime_type: "application/pdf" }],
    });

    render(<PortalGlobalSearch />);
    fireEvent.change(screen.getByLabelText(/search portal/i), {
      target: { value: "report" },
    });

    // The debounce is 300 ms; findByText waits past it.
    expect(await screen.findByText("Documents")).toBeInTheDocument();
    const link = screen.getByText("Shared report").closest("a");
    expect(link).toHaveAttribute("href", "/portal/documents/doc-1");
  });

  it("treats a documents-only match as a result, not an empty search", async () => {
    mockPortalSearch.mockResolvedValue({
      tickets: [],
      projects: [],
      documents: [{ id: "doc-2", name: "Only a document", mime_type: null }],
    });

    render(<PortalGlobalSearch />);
    fireEvent.change(screen.getByLabelText(/search portal/i), {
      target: { value: "document" },
    });

    expect(await screen.findByText("Documents")).toBeInTheDocument();
    expect(screen.queryByText(/no results found/i)).not.toBeInTheDocument();
  });
});
