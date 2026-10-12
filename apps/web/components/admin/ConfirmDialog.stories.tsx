import type { Meta, StoryObj } from "@storybook/react";
import ConfirmDialog from "./ConfirmDialog";

const meta: Meta<typeof ConfirmDialog> = {
  title: "App/ConfirmDialog",
  component: ConfirmDialog,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Accessible confirmation dialog (replaces `window.confirm`): labelled `role=\"dialog\"`, focus trap, Escape to close, scrollable within the viewport.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    onConfirm: { control: false },
    onClose: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

export const Open: Story = {
  args: {
    open: true,
    title: "Delete saved view?",
    body: "This removes the shared view for everyone in the organization.",
    confirmLabel: "Delete view",
    cancelLabel: "Keep view",
    onConfirm: () => {},
    onClose: () => {},
  },
};

export const Danger: Story = {
  args: {
    open: true,
    danger: true,
    title: "Revoke API key?",
    body: "Requests signed with this key will start failing immediately.",
    confirmLabel: "Revoke key",
    onConfirm: () => {},
    onClose: () => {},
  },
};

export const WithoutBody: Story = {
  args: {
    open: true,
    title: "Discard draft?",
    onConfirm: () => {},
    onClose: () => {},
  },
};
