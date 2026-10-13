import type { Meta, StoryObj } from "@storybook/react";
import Breadcrumbs from "./Breadcrumbs";

const meta: Meta<typeof Breadcrumbs> = {
  title: "App/Breadcrumbs",
  component: Breadcrumbs,
  parameters: {
    docs: {
      description: {
        component:
          "Breadcrumb trail rendered as a labelled `nav` + ordered list. The last item is the current page and is not a link.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  args: {
    items: [
      { label: "Admin", href: "/admin" },
      { label: "Store", href: "/admin/store" },
      { label: "Promotions" },
    ],
  },
};

export const TwoLevels: Story = {
  args: {
    items: [{ label: "Portal", href: "/portal/dashboard" }, { label: "Documents" }],
  },
};
