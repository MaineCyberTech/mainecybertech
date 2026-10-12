import type { Meta, StoryObj } from "@storybook/react";
import { ToastProvider, useToast } from "./ToastProvider";

function ToastDemo() {
  const { pushToast } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="cyber-button"
        onClick={() => pushToast("success", "Ticket updated.", "Saved")}
      >
        Success toast
      </button>
      <button
        type="button"
        className="cyber-button-secondary"
        onClick={() => pushToast("info", "Export queued; you will be notified.")}
      >
        Info toast
      </button>
      <button
        type="button"
        className="cyber-button-secondary"
        onClick={() => pushToast("error", "Could not save the document.", "Upload failed")}
      >
        Error toast (persists)
      </button>
    </div>
  );
}

const meta: Meta<typeof ToastProvider> = {
  title: "App/ToastProvider",
  component: ToastProvider,
  parameters: {
    docs: {
      description: {
        component:
          "Toast host with polite (`role=\"status\"`) and assertive (`role=\"alert\"`) live regions. Errors persist until dismissed; other tones auto-dismiss.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ToastProvider>;

export const Default: Story = {
  args: {
    children: <ToastDemo />,
  },
};
