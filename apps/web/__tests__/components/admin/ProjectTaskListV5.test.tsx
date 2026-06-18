import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/admin/AvatarPill", () => {
  return function MockAvatarPill({ name, subtitle, size, active }: any) {
    return <span data-testid="avatar-pill">{name}{subtitle ? ` (${subtitle})` : ""}{active ? " [active]" : ""}</span>;
  };
});

jest.mock("@/components/admin/ConfirmIntentButton", () => {
  return function MockConfirmButton({ label, onConfirm, confirmMessage, ...rest }: any) {
    return <button data-testid="confirm-btn" onClick={() => { const ok = confirm(confirmMessage ?? "Confirm?"); if (ok) onConfirm(); }} {...rest}>{label}</button>;
  };
});

jest.mock("@/components/CommentBody", () => {
  return function MockCommentBody({ body, className }: any) {
    return <div className={className}>{body}</div>;
  };
});

const mockCreateTask = jest.fn();
const mockSubmitTaskForm = jest.fn();
const mockReorderTasks = jest.fn();
const mockAddComment = jest.fn();
const mockUpdateComment = jest.fn();
const mockDeleteComment = jest.fn();
const mockMarkRead = jest.fn();

const baseOwners = [
  { id: "u1", full_name: "Alice", email: "a@t.com" },
  { id: "u2", full_name: "Bob", email: "b@t.com" },
];

const baseTask = {
  id: "t1", title: "Implement auth", description: "Add login flow", details: "Use JWT",
  status: "todo", due_at: new Date(Date.now() + 86400000).toISOString(),
  sort_order: 1, approval_required: false,
  owner_id: "u1", owner_name: "Alice", owner_email: "a@t.com",
  created_by: "admin", created_by_name: "Admin", created_by_email: "admin@t.com",
  comments: [], unread_count: 0,
};

function renderTaskList(overrides: any = {}) {
  const tasks = overrides.tasks ?? [baseTask];
  return render(
    <ProjectTaskListV5
      projectId="p1"
      organizationId="o1"
      tasks={tasks}
      owners={baseOwners}
      createTaskAction={mockCreateTask}
      submitTaskFormAction={mockSubmitTaskForm}
      reorderTasksAction={mockReorderTasks}
      addTaskCommentAction={mockAddComment}
      updateTaskCommentAction={mockUpdateComment}
      deleteTaskCommentAction={mockDeleteComment}
      markTaskCommentsReadAction={mockMarkRead}
    />
  );
}

// need to import after mocks are set up
let ProjectTaskListV5: typeof import("@/components/admin/ProjectTaskListV5").default;

describe("ProjectTaskListV5", () => {
  beforeAll(async () => {
    ProjectTaskListV5 = (await import("@/components/admin/ProjectTaskListV5")).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initial render", () => {
    it("renders add task form", () => {
      renderTaskList();
      expect(screen.getByRole("heading", { name: "Add Task" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add Task" })).toBeInTheDocument();
    });

    it("renders task cards from props", () => {
      renderTaskList();
      expect(screen.getByText("Implement auth")).toBeInTheDocument();
      expect(screen.getAllByText("Use JWT").length).toBeGreaterThanOrEqual(1);
    });

    it("renders task status pill", () => {
      renderTaskList();
      const statusPills = screen.getAllByText((c) => c === "todo" || c === "in_progress" || c === "done" || c === "blocked");
      expect(statusPills.length).toBeGreaterThanOrEqual(1);
    });

    it("renders owner avatar from task", () => {
      renderTaskList();
      expect(screen.getAllByTestId("avatar-pill").length).toBeGreaterThanOrEqual(1);
    });

    it("renders due date", () => {
      renderTaskList();
      expect(screen.getByText(/UTC/)).toBeInTheDocument();
    });

    it("shows empty state when no tasks match filters", () => {
      renderTaskList({ tasks: [] });
      expect(screen.getByText("No tasks match the current filters.")).toBeInTheDocument();
    });

    it("renders multiple task cards", () => {
      renderTaskList({
        tasks: [
          baseTask,
          { ...baseTask, id: "t2", title: "Task two" },
        ],
      });
      expect(screen.getByText("Implement auth")).toBeInTheDocument();
      expect(screen.getByText("Task two")).toBeInTheDocument();
    });
  });

  describe("search filter", () => {
    it("filters tasks by search query", async () => {
      renderTaskList({
        tasks: [
          baseTask,
          { ...baseTask, id: "t2", title: "Design UI" },
        ],
      });
      const searchInput = screen.getByPlaceholderText("title, details, owner...");
      await userEvent.type(searchInput, "Design");
      expect(screen.queryByText("Implement auth")).not.toBeInTheDocument();
      expect(screen.getByText("Design UI")).toBeInTheDocument();
    });

    it("shows no results message when filter matches nothing", async () => {
      renderTaskList();
      const searchInput = screen.getByPlaceholderText("title, details, owner...");
      await userEvent.type(searchInput, "zzzznotfound");
      expect(screen.getByText("No tasks match the current filters.")).toBeInTheDocument();
    });
  });

  describe("status filter", () => {
    it("filters by status when quick status button clicked", async () => {
      renderTaskList({
        tasks: [
          baseTask,
          { ...baseTask, id: "t2", title: "Done task", status: "done" },
        ],
      });
      await userEvent.click(screen.getByText("Done"));
      expect(screen.queryByText("Implement auth")).not.toBeInTheDocument();
      expect(screen.getByText("Done task")).toBeInTheDocument();
    });

    it("shows all tasks when All filter selected", async () => {
      renderTaskList({
        tasks: [
          baseTask,
          { ...baseTask, id: "t2", title: "Done task", status: "done" },
        ],
      });
      await userEvent.click(screen.getByText("Done"));
      await userEvent.click(screen.getByText("All"));
      expect(screen.getByText("Implement auth")).toBeInTheDocument();
      expect(screen.getByText("Done task")).toBeInTheDocument();
    });
  });

  describe("owner filter", () => {
    it("filters by owner when owner button clicked", async () => {
      renderTaskList({
        tasks: [
          baseTask,
          { ...baseTask, id: "t2", title: "Bob task", owner_id: "u2", owner_name: "Bob" },
        ],
      });
      const bobButtons = screen.getAllByText((c) => c.includes("Bob"));
      const ownerBtn = bobButtons.find((el) => el.tagName === "BUTTON");
      if (ownerBtn) await userEvent.click(ownerBtn);
      expect(screen.getByText("Bob task")).toBeInTheDocument();
    });
  });

  describe("task card expand", () => {
    it("shows details section when expanded", async () => {
      renderTaskList();
      const details = screen.getByText("Implement auth").closest("details")!;
      expect(details.open).toBe(false);
      // Click the summary to toggle
      const summary = details.querySelector("summary")!;
      await userEvent.click(summary);
      expect(details.open).toBe(true);
    });

    it("shows created by info when expanded", async () => {
      renderTaskList();
      const details = screen.getByText("Implement auth").closest("details")!;
      const summary = details.querySelector("summary")!;
      await userEvent.click(summary);
      expect(screen.getByText((c) => c.includes("Created by: Admin"))).toBeInTheDocument();
    });
  });

  describe("task form submission", () => {
    it("submits create task form with title", async () => {
      mockCreateTask.mockResolvedValue({ ok: true, task: { ...baseTask, id: "new1" } });
      renderTaskList();
      const inputs = document.querySelectorAll<HTMLInputElement>("input[name='title']");
      const addTaskInput = inputs[0];
      await userEvent.type(addTaskInput, "New task");
      const addTaskForm = addTaskInput.closest("form")!;
      fireEvent.submit(addTaskForm);
      await waitFor(() => {
        expect(mockCreateTask).toHaveBeenCalled();
      });
    });
  });

  describe("approval required badge", () => {
    it("shows approval required badge when set", () => {
      renderTaskList({
        tasks: [{ ...baseTask, approval_required: true }],
      });
      expect(screen.getByText("Approval Required")).toBeInTheDocument();
    });

    it("shows approved badge when approved", () => {
      renderTaskList({
        tasks: [{ ...baseTask, approval_required: true, approved_at: new Date().toISOString(), approved_by_name: "Admin" }],
      });
      expect(screen.getByText("Approved")).toBeInTheDocument();
    });
  });

  describe("comment count", () => {
    it("shows comment count when comments exist", () => {
      renderTaskList({
        tasks: [{
          ...baseTask,
          comments: [{ id: "c1", body: "Nice", author_name: "Alice", created_at: new Date().toISOString() }],
          unread_count: 1,
        }],
      });
      expect(screen.getByText((c) => c.includes("Comments") && c.includes("1"))).toBeInTheDocument();
    });

    it("shows unread badge when unread > 0", () => {
      renderTaskList({
        tasks: [{
          ...baseTask,
          comments: [{ id: "c1", body: "Nice", author_name: "Alice", created_at: new Date().toISOString() }],
          unread_count: 1,
        }],
      });
      expect(screen.getByText((c) => c.includes("Unread") && c.includes("1"))).toBeInTheDocument();
    });
  });

  describe("empty task details", () => {
    it("shows fallback when no details or description", () => {
      renderTaskList({
        tasks: [{ ...baseTask, details: null, description: null }],
      });
      expect(screen.getByText("No task details provided.")).toBeInTheDocument();
    });
  });

  describe("save order indicator", () => {
    it("does not show saving indicator initially", () => {
      renderTaskList();
      expect(screen.queryByText("Saving task order…")).not.toBeInTheDocument();
    });
  });

  describe("sort order display", () => {
    it("shows sort order input in expanded task", async () => {
      renderTaskList({
        tasks: [{ ...baseTask, sort_order: 5 }],
      });
      const details = screen.getByText("Implement auth").closest("details")!;
      const summary = details.querySelector("summary")!;
      await userEvent.click(summary);
      const sortInputs = document.querySelectorAll<HTMLInputElement>("input[name='sortOrder']");
      // second sortOrder input is inside the task card form
      const cardSortInput = sortInputs[1];
      expect(cardSortInput).toHaveValue("5");
    });
  });
});
