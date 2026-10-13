import type { Meta, StoryObj } from "@storybook/react";
import StatusPill from "./StatusPill";

const meta: Meta<typeof StatusPill> = {
  title: "App/StatusPill",
  component: StatusPill,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Status badge with a tone derived from the status keyword (or overridden via `tone`).",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    tone: {
      control: "select",
      options: [
        "emerald",
        "amber",
        "red",
        "blue",
        "sky",
        "purple",
        "indigo",
        "teal",
        "cyan",
        "orange",
        "slate",
        "gray",
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusPill>;

export const Active: Story = {
  args: {
    status: "active",
  },
};

export const Overdue: Story = {
  args: {
    status: "overdue",
  },
};

export const CustomLabel: Story = {
  args: {
    status: "in_progress",
    label: "In progress",
  },
};

export const ToneOverride: Story = {
  args: {
    status: "archived",
    tone: "red",
  },
};
