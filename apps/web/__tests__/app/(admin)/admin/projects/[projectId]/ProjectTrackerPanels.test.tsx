import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockPhasesList = jest.fn();
const mockPhasesCreate = jest.fn();
const mockPhasesRemove = jest.fn();
const mockMilestonesList = jest.fn();
const mockDependenciesList = jest.fn();

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    projects: {
      phases: { list: mockPhasesList, create: mockPhasesCreate, remove: mockPhasesRemove },
      milestones: {
        list: mockMilestonesList,
        create: jest.fn(),
        remove: jest.fn(),
      },
      dependencies: {
        list: mockDependenciesList,
        create: jest.fn(),
        remove: jest.fn(),
      },
    },
  }),
}));

import ProjectTrackerPanels from "@/app/(admin)/admin/projects/[projectId]/ProjectTrackerPanels";

describe("ProjectTrackerPanels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPhasesList.mockResolvedValue({ items: [] });
    mockMilestonesList.mockResolvedValue({ items: [] });
    mockDependenciesList.mockResolvedValue({ items: [] });
  });

  it("loads and renders phases, milestones and dependencies", async () => {
    mockPhasesList.mockResolvedValue({
      items: [
        { id: "ph1", name: "Discovery", status: "planned", start_date: null, end_date: null },
      ],
    });
    mockMilestonesList.mockResolvedValue({
      items: [{ id: "ms1", title: "Sign-off", status: "pending", due_date: "2026-10-01" }],
    });
    mockDependenciesList.mockResolvedValue({
      items: [
        {
          id: "dp1",
          dependency_type: "finish_to_start",
          depends_on_task_id: "00000000-0000-0000-0000-0000000000aa",
          blocked_by_project_id: null,
        },
      ],
    });

    render(<ProjectTrackerPanels projectId="p1" />);

    expect(await screen.findByText("Discovery")).toBeInTheDocument();
    expect(screen.getByText("Sign-off")).toBeInTheDocument();
    expect(screen.getByText(/finish to start/)).toBeInTheDocument();
  });

  it("creates a phase and reloads", async () => {
    mockPhasesCreate.mockResolvedValue({ id: "ph2" });
    render(<ProjectTrackerPanels projectId="p1" />);

    await waitFor(() => expect(mockPhasesList).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/phase name/i), {
      target: { value: "Implementation" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add phase/i }));

    await waitFor(() =>
      expect(mockPhasesCreate).toHaveBeenCalledWith({ projectId: "p1", name: "Implementation" }),
    );
  });

  it("shows an error when loading fails", async () => {
    mockPhasesList.mockRejectedValue(new Error("boom"));
    render(<ProjectTrackerPanels projectId="p1" />);

    expect(await screen.findByText(/failed to load project tracker/i)).toBeInTheDocument();
  });
});
