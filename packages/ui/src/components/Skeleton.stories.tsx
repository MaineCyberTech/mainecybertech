import type { Meta, StoryObj } from "@storybook/react";
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
} from "@mct/ui/components/Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Skeleton loading placeholders with multiple variants and compound components.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["text", "circular", "rectangular"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: { variant: "text" },
};

export const Circular: Story = {
  args: { variant: "circular", className: "w-12 h-12" },
};

export const Rectangular: Story = {
  args: { variant: "rectangular", className: "w-32 h-16" },
};

export const CustomSize: Story = {
  args: { variant: "rectangular", width: "200px", height: "100px" },
};

export const SkeletonTextDefault: Story = {
  render: () => <SkeletonText lines={3} />,
};

export const SkeletonTextSingle: Story = {
  render: () => <SkeletonText lines={1} />,
};

export const SkeletonTextMany: Story = {
  render: () => <SkeletonText lines={5} />,
};

export const SkeletonCardDefault: Story = {
  render: () => <SkeletonCard className="max-w-md" />,
};

export const SkeletonTableDefault: Story = {
  render: () => <SkeletonTable rows={5} columns={4} className="max-w-2xl" />,
};

export const SkeletonTableSmall: Story = {
  render: () => <SkeletonTable rows={3} columns={3} className="max-w-md" />,
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
      <Skeleton variant="rectangular" className="w-full h-24" />
      <SkeletonText lines={3} />
    </div>
  ),
};

export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonTable rows={4} columns={4} />
      <SkeletonText lines={2} />
    </div>
  ),
};
