import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Dialog } from "@mct/ui/components/Dialog";
import { Button } from "@mct/ui/components/Button";

const meta: Meta<typeof Dialog> = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Dialog modal component with multiple sizes and accessibility features.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "full"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Dialog Title"
          description="This is a description of the dialog."
        >
          <p className="cyber-subtext">
            This is the dialog content. You can put any content here.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Confirm</Button>
          </div>
        </Dialog>
      </>
    );
  },
};

export const Small: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Small Dialog</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          size="sm"
          title="Small Dialog"
        >
          <p className="cyber-subtext">This is a small dialog.</p>
        </Dialog>
      </>
    );
  },
};

export const Large: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Large Dialog</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          size="lg"
          title="Large Dialog"
        >
          <p className="cyber-subtext">
            This is a large dialog with more content space.
          </p>
        </Dialog>
      </>
    );
  },
};

export const FullScreen: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Full Dialog</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          size="full"
          title="Full Screen Dialog"
        >
          <p className="cyber-subtext">This dialog takes the full width.</p>
        </Dialog>
      </>
    );
  },
};

export const WithoutTitle: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog (No Title)</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <p className="cyber-subtext">
            This dialog has no title or description.
          </p>
        </Dialog>
      </>
    );
  },
};

export const ConfirmDelete: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete Item
        </Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Confirm Deletion"
          description="This action cannot be undone."
          size="sm"
        >
          <p className="cyber-subtext">
            Are you sure you want to delete this item? All associated data will
            be permanently removed.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </div>
        </Dialog>
      </>
    );
  },
};

export const FormDialog: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Form</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Create New Ticket"
          description="Fill in the details below."
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="cyber-label">Title</label>
              <input
                type="text"
                className="cyber-input"
                placeholder="Enter ticket title"
              />
            </div>
            <div>
              <label className="cyber-label">Description</label>
              <textarea
                className="cyber-input min-h-[100px] resize-y"
                placeholder="Enter description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Create</Button>
            </div>
          </div>
        </Dialog>
      </>
    );
  },
};
