import type { Meta, StoryObj } from "@storybook/react";
import EmptyState from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "App/EmptyState",
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component:
          "Empty/zero-data state with an icon, heading, optional description and up to two actions (link or callback).",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    icon: {
      control: "text",
      description: "Emoji key resolved through the component's icon map",
    },
    actionOnClick: { control: false },
    secondaryAction: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    icon: "🎫",
    title: "No tickets yet",
    description: "Tickets you open will appear here with their status and updates.",
  },
};

export const WithLinkAction: Story = {
  args: {
    icon: "📄",
    title: "No documents shared",
    description: "Documents shared with your organization will appear here.",
    actionLabel: "Upload document",
    actionHref: "/portal/documents",
  },
};

export const WithCallbackActions: Story = {
  args: {
    icon: "🔍",
    title: "No results",
    description: "Try a different search term or clear the active filters.",
    actionLabel: "Clear filters",
    actionOnClick: () => {},
    secondaryLabel: "Refresh",
    secondaryAction: () => {},
  },
};
