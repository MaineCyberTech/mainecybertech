import type { Meta, StoryObj } from "@storybook/react";
import { Input, Textarea } from "@mct/ui/components/Input";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Input component with label, error, and helper text support.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    error: { control: "text" },
    helperText: { control: "text" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Email Address",
    placeholder: "you@example.com",
    type: "email",
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Password",
    type: "password",
    placeholder: "Enter password",
    helperText: "Must be at least 8 characters",
  },
};

export const WithError: Story = {
  args: {
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
    value: "invalid-email",
    error: "Please enter a valid email address",
  },
};

export const Required: Story = {
  args: {
    label: "Username",
    placeholder: "Enter username",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled Input",
    placeholder: "Cannot edit",
    disabled: true,
  },
};

export const TextareaDefault: Story = {
  render: () => (
    <Textarea label="Message" placeholder="Enter your message..." rows={4} />
  ),
};

export const TextareaWithError: Story = {
  render: () => (
    <Textarea
      label="Bio"
      placeholder="Tell us about yourself"
      rows={4}
      error="Bio must be at least 50 characters"
      helperText="Current: 12 characters"
    />
  ),
};

export const AllStates: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <Input label="Default" placeholder="Default state" />
      <Input
        label="With Helper"
        placeholder="Has helper text"
        helperText="This is helper text"
      />
      <Input
        label="Error State"
        placeholder="Has error"
        error="This field is required"
      />
      <Input label="Disabled" placeholder="Disabled" disabled />
    </div>
  ),
};
