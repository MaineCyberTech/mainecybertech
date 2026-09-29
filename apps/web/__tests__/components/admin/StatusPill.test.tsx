import { render, screen } from "@testing-library/react";
import { StatusPill } from "@/components/admin/StatusPill";

describe("StatusPill", () => {
  it.each([
    ["active", "emerald"],
    ["live", "emerald"],
    ["submitted", "emerald"],
    ["hidden", "slate"],
    ["archived", "slate"],
    ["not_started", "slate"],
    ["partial_outage", "amber"],
    ["investigating", "amber"],
    ["reviewing", "amber"],
    ["major_outage", "red"],
    ["identified", "red"],
    ["monitoring", "blue"],
    ["scheduled", "blue"],
    ["implemented", "emerald"],
    ["ready", "emerald"],
    ["mitigated", "emerald"],
    ["needed", "amber"],
    ["needs_review", "amber"],
    ["accepted", "amber"],
    ["requested", "blue"],
    ["staged", "blue"],
    ["new", "blue"],
    ["overdue", "red"],
  ])("renders %s with the shared %s tone", (status, tone) => {
    render(<StatusPill status={status} />);

    expect(screen.getByText(status).className).toContain(`-${tone}-`);
  });

  it("normalizes spaces to underscores before looking up the shared map", () => {
    render(<StatusPill status="not started" />);

    expect(screen.getByText("not started").className).toContain("-slate-");
  });

  it("falls back to the slate tone for unknown statuses", () => {
    render(<StatusPill status="mystery_state" />);

    expect(screen.getByText("mystery_state").className).toContain("-slate-");
  });

  it("prefers an explicit tone override", () => {
    render(<StatusPill status="active" tone="red" />);

    expect(screen.getByText("active").className).toContain("-red-");
  });

  it("renders a custom label in place of the raw status", () => {
    render(<StatusPill status="not_started" label="Not started" />);

    expect(screen.getByText("Not started")).toBeInTheDocument();
  });
});
