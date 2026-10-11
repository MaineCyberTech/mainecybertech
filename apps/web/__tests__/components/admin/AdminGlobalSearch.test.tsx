import { jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const mockAdminSearch = jest.fn();

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    search: { admin: mockAdminSearch },
  }),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";

describe("AdminGlobalSearch", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the documents group returned by the API [SEARCH-P2-003]", async () => {
    mockAdminSearch.mockResolvedValue({
      users: [],
      organizations: [],
      tickets: [],
      projects: [],
      documents: [
        {
          id: "doc-1",
          name: "Acme incident report",
          mime_type: "application/pdf",
          visibility: "org",
        },
      ],
    });

    render(<AdminGlobalSearch />);
    fireEvent.change(screen.getByLabelText(/search administration/i), {
      target: { value: "acme" },
    });

    // The debounce is 300 ms; findByText waits past it.
    expect(await screen.findByText("Documents")).toBeInTheDocument();
    const link = screen.getByText("Acme incident report").closest("a");
    expect(link).toHaveAttribute("href", "/portal/documents/doc-1");
    expect(mockAdminSearch).toHaveBeenCalledWith("acme");
  });

  it("does not show a documents group when the API returns none", async () => {
    mockAdminSearch.mockResolvedValue({
      users: [],
      organizations: [],
      tickets: [{ id: "t1", title: "Only a ticket", status: "open", priority: "high" }],
      projects: [],
      documents: [],
    });

    render(<AdminGlobalSearch />);
    fireEvent.change(screen.getByLabelText(/search administration/i), {
      target: { value: "ticket" },
    });

    expect(await screen.findByText("Tickets")).toBeInTheDocument();
    expect(screen.queryByText("Documents")).not.toBeInTheDocument();
  });
});
