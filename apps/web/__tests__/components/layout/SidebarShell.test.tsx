import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SidebarShell from "@/components/layout/SidebarShell";

const nav = <nav aria-label="Test navigation">Nav content</nav>;

describe("SidebarShell mobile drawer accessibility", () => {
  it("opens the drawer when the toggle is clicked", async () => {
    render(
      <SidebarShell navLabel="Open navigation" brandLabel="MCT" content={nav}>
        <p>Page body</p>
      </SidebarShell>,
    );

    fireEvent.click(screen.getByLabelText("Open navigation"));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("closes the drawer on Escape and restores focus to the toggle", async () => {
    render(
      <SidebarShell navLabel="Open navigation" brandLabel="MCT" content={nav}>
        <p>Page body</p>
      </SidebarShell>,
    );

    const toggle = screen.getByLabelText("Open navigation");
    fireEvent.click(toggle);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(document.activeElement).toBe(toggle);
  });

  it("moves focus into the drawer on open (close button focused)", async () => {
    render(
      <SidebarShell navLabel="Open navigation" brandLabel="MCT" content={nav}>
        <p>Page body</p>
      </SidebarShell>,
    );

    fireEvent.click(screen.getByLabelText("Open navigation"));
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByLabelText("Close menu"));
    });
  });

  it("exposes aria-expanded on the toggle", async () => {
    render(
      <SidebarShell navLabel="Open navigation" brandLabel="MCT" content={nav}>
        <p>Page body</p>
      </SidebarShell>,
    );

    const toggle = screen.getByLabelText("Open navigation");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute("aria-expanded", "true"));
  });
});
