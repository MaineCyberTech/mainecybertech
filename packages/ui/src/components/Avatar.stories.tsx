import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "@mct/ui/components/Avatar";

const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Avatar component with fallback initials, multiple sizes, and shapes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
    },
    shape: {
      control: "select",
      options: ["circle", "square"],
    },
    fallback: { control: "text" },
    alt: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

const avatarSrc = "https://api.dicebear.com/7.x/avataaars/svg?seed=test";

export const Default: Story = {
  args: {
    src: avatarSrc,
    alt: "Test User",
  },
};

export const WithFallback: Story = {
  args: {
    fallback: "TU",
    alt: "Test User",
  },
};

export const Small: Story = {
  args: {
    src: avatarSrc,
    alt: "Test User",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    src: avatarSrc,
    alt: "Test User",
    size: "lg",
  },
};

export const ExtraLarge: Story = {
  args: {
    src: avatarSrc,
    alt: "Test User",
    size: "xl",
  },
};

export const Square: Story = {
  args: {
    src: avatarSrc,
    alt: "Test User",
    shape: "square",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar src={avatarSrc} alt="Test" size="sm" />
      <Avatar src={avatarSrc} alt="Test" size="md" />
      <Avatar src={avatarSrc} alt="Test" size="lg" />
      <Avatar src={avatarSrc} alt="Test" size="xl" />
    </div>
  ),
};

export const AllShapes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar src={avatarSrc} alt="Circle" shape="circle" size="lg" />
      <Avatar src={avatarSrc} alt="Square" shape="square" size="lg" />
    </div>
  ),
};

export const WithLongFallback: Story = {
  args: {
    fallback: "AV",
    alt: "Another User",
    size: "lg",
  },
};

export const ErrorState: Story = {
  args: {
    src: "https://invalid-url-that-will-fail.com/image.jpg",
    fallback: "ER",
    alt: "Error User",
  },
};
