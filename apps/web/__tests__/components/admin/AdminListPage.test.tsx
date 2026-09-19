import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("@/components/Breadcrumbs", () => {
  return function MockBreadcrumbs({ items }: any) {
    return (
      <nav data-testid="breadcrumbs">
        {items.map((i: any) => i.label).join(" > ")}
      </nav>
    );
  };
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: any) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

describe("AdminListPage", () => {
  let AdminListPage: typeof import("@/components/admin/AdminListPage").default;

  beforeAll(async () => {
    AdminListPage = (await import("@/components/admin/AdminListPage")).default;
  });

  it("renders title and description", () => {
    render(<AdminListPage title="Widgets" description="Manage widgets." items={[]} />);
    expect(screen.getByRole("heading", { name: "Widgets" })).toBeInTheDocument();
    expect(screen.getByText("Manage widgets.")).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", () => {
    render(
      <AdminListPage title="Widgets" subnavCurrent="widgets" items={[]} />,
    );
    expect(screen.getByTestId("breadcrumbs")).toHaveTextContent("Admin > Widgets");
    expect(screen.getByTestId("subnav")).toHaveTextContent("widgets");
  });

  it("renders the New button from newHref", () => {
    render(
      <AdminListPage
        title="Widgets"
        items={[]}
        newHref="/admin/widgets/new"
        newLabel="+ New Widget"
      />,
    );
    const link = screen.getByText("+ New Widget").closest("a");
    expect(link).toHaveAttribute("href", "/admin/widgets/new");
  });

  it("renders custom actions", () => {
    render(
      <AdminListPage title="Widgets" items={[]} actions={<button>Export</button>} />,
    );
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("renders headerContent above the list", () => {
    render(
      <AdminListPage
        title="Widgets"
        items={[]}
        headerContent={<div data-testid="stats">3 total</div>}
      />,
    );
    expect(screen.getByTestId("stats")).toHaveTextContent("3 total");
  });

  it("renders default empty state when no items", () => {
    render(<AdminListPage title="Widgets" items={[]} />);
    expect(screen.getByText("No items found.")).toBeInTheDocument();
  });

  it("renders custom emptyMessage", () => {
    render(<AdminListPage title="Widgets" items={[]} emptyMessage="Nothing here." />);
    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("renders custom emptyState node", () => {
    render(
      <AdminListPage
        title="Widgets"
        items={[]}
        emptyState={<div data-testid="custom-empty">No widgets</div>}
      />,
    );
    expect(screen.getByTestId("custom-empty")).toBeInTheDocument();
  });

  it("renders rows via renderRow", () => {
    const items = [
      { id: "a", name: "Alpha" },
      { id: "b", name: "Beta" },
    ];
    render(
      <AdminListPage
        title="Widgets"
        items={items}
        getId={(i) => i.id}
        renderRow={(i) => <div>{i.name}</div>}
      />,
    );
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("shows skeleton when loading", () => {
    const { container } = render(<AdminListPage title="Widgets" items={[]} loading />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("wraps list in cyber-panel when panel is set", () => {
    const items = [{ id: "a", name: "Alpha" }];
    const { container } = render(
      <AdminListPage
        title="Widgets"
        items={items}
        panel
        getId={(i) => i.id}
        renderRow={(i) => <div>{i.name}</div>}
      />,
    );
    expect(container.querySelector("section.cyber-panel")).toBeInTheDocument();
  });

  it("calls onChange immediately without debounce", () => {
    const onChange = jest.fn();
    render(
      <AdminListPage
        title="Widgets"
        items={[]}
        search={{ value: "", onChange, placeholder: "Find" }}
      />,
    );
    const input = screen.getByPlaceholderText("Find");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(onChange).toHaveBeenCalledWith("abc");
  });

  it("debounces onChange when debounceMs is set", async () => {
    const onChange = jest.fn();
    render(
      <AdminListPage
        title="Widgets"
        items={[]}
        search={{ value: "", onChange, debounceMs: 100 }}
      />,
    );
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "xyz" } });
    expect(onChange).not.toHaveBeenCalled();
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("xyz"));
  });
});
