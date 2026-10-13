import type { Meta, StoryObj } from "@storybook/react";
import { Chip } from "@mct/ui/components/Chip";

const meta: Meta<typeof Chip> = {
  title: "Components/Chip",
  component: Chip,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Filter chip with an optional remove control. The remove button is a 24x24 target with an accessible name (`Remove <label>` by default).",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    onRemove: { control: false },
    removeLabel: {
      control: "text",
      description: "Override the remove button's accessible name",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Static: Story = {
  args: {
    label: "Status: open",
  },
};

export const Removable: Story = {
  args: {
    label: "Status: open",
    onRemove: () => {},
  },
};

export const CustomRemoveLabel: Story = {
  args: {
    label: "Org: Acme",
    removeLabel: "Remove organization filter",
    onRemove: () => {},
  },
};

export const FilterRow: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Chip label='Search: "vpn"' onRemove={() => {}} />
      <Chip label="Status: open" onRemove={() => {}} />
      <Chip label="Org: Acme" onRemove={() => {}} />
    </div>
  ),
};
