import { render, screen } from "@testing-library/react";

describe("AdminPageShell", () => {
  let AdminPageShell: typeof import("@/components/admin/AdminPageShell").default;

  beforeAll(async () => {
    AdminPageShell = (await import("@/components/admin/AdminPageShell")).default;
  });

  it("renders title", () => {
    render(<AdminPageShell title="Users">child content</AdminPageShell>);
    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <AdminPageShell title="Users" description="Manage user accounts.">
        child content
      </AdminPageShell>,
    );
    expect(screen.getByText("Manage user accounts.")).toBeInTheDocument();
  });

  it("does not render description when absent", () => {
    const { container } = render(
      <AdminPageShell title="Users">child content</AdminPageShell>,
    );
    expect(container.querySelector(".cyber-subtext")).not.toBeInTheDocument();
  });

  it("renders children", () => {
    render(<AdminPageShell title="Users"><div data-testid="child">content</div></AdminPageShell>);
    expect(screen.getByTestId("child")).toHaveTextContent("content");
  });

  it("renders actions when provided", () => {
    render(
      <AdminPageShell title="Users" actions={<button>Create</button>}>
        child
      </AdminPageShell>,
    );
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("does not render actions section when absent", () => {
    const { container } = render(<AdminPageShell title="Users">child</AdminPageShell>);
    const actions = container.querySelector(".flex-wrap");
    expect(actions).not.toBeInTheDocument();
  });

  it("renders breadcrumbs when provided", () => {
    render(
      <AdminPageShell
        title="Users"
        breadcrumbs={<nav data-testid="crumbs">Breadcrumbs</nav>}
      >
        child
      </AdminPageShell>,
    );
    expect(screen.getByTestId("crumbs")).toBeInTheDocument();
  });

  it("renders subnav when provided", () => {
    render(
      <AdminPageShell
        title="Users"
        subnav={<nav data-testid="subnav">Subnav</nav>}
      >
        child
      </AdminPageShell>,
    );
    expect(screen.getByTestId("subnav")).toBeInTheDocument();
  });
});
