import type { Meta, StoryObj } from "@storybook/react";
import DataErrorNote from "./DataErrorNote";

const meta: Meta<typeof DataErrorNote> = {
  title: "App/DataErrorNote",
  component: DataErrorNote,
  parameters: {
    docs: {
      description: {
        component:
          "Visible `role=\"status\"` note for server-rendered pages whose primary fetch failed, so a failed load is distinguishable from genuinely empty data.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DataErrorNote>;

export const Default: Story = {
  args: {
    what: "tickets",
  },
};

export const WithDetail: Story = {
  args: {
    what: "store promotions",
    detail: "The API returned 503; the table below may be incomplete.",
  },
};
