import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("TaskOrderEditor", () => {
  let TaskOrderEditor: typeof import("@/components/admin/TaskOrderEditor").default;

  beforeAll(async () => {
    TaskOrderEditor = (await import("@/components/admin/TaskOrderEditor")).default;
  });

  const tasks = [
    { id: "1", title: "Task A", status: "todo", ownerLabel: "Alice" },
    { id: "2", title: "Task B", status: "in_progress", ownerLabel: null },
    { id: "3", title: "Task C", status: "done", ownerLabel: "Bob" },
  ];

  it("renders all tasks with titles", () => {
    render(<TaskOrderEditor tasks={tasks} />);
    expect(screen.getByText("Task A")).toBeInTheDocument();
    expect(screen.getByText("Task B")).toBeInTheDocument();
    expect(screen.getByText("Task C")).toBeInTheDocument();
  });

  it("renders owner label when present", () => {
    render(<TaskOrderEditor tasks={tasks} />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it("hides owner label when null", () => {
    render(<TaskOrderEditor tasks={tasks} />);
    expect(screen.getByText("in_progress")).toBeInTheDocument();
    expect(screen.queryByText("in_progress •")).not.toBeInTheDocument();
  });

  it("renders hidden input with order JSON", () => {
    const { container } = render(<TaskOrderEditor tasks={tasks} />);
    const hiddenInput = container.querySelector<HTMLInputElement>('input[type="hidden"][name="order"]');
    expect(hiddenInput).toBeInTheDocument();
    expect(JSON.parse(hiddenInput!.value)).toEqual(["1", "2", "3"]);
  });

  it("renders empty state when no tasks", () => {
    render(<TaskOrderEditor tasks={[]} />);
    expect(screen.getByText("No tasks available to reorder.")).toBeInTheDocument();
  });

  it("renders draggable items", () => {
    render(<TaskOrderEditor tasks={tasks} />);
    const items = screen.getByText("Task A").closest("[draggable]");
    expect(items).toBeInTheDocument();
  });
});
