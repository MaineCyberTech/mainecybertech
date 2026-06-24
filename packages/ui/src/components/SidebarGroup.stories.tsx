import type { Meta, StoryObj } from "@storybook/react";
import { SidebarGroup, SidebarItem } from "@mct/ui/components/SidebarGroup";

const meta: Meta<typeof SidebarGroup> = {
  title: "Components/SidebarGroup",
  component: SidebarGroup,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Collapsible sidebar group with navigation items.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    defaultOpen: { control: "boolean" },
    title: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof SidebarGroup>;

export const Default: Story = {
  args: {
    title: "Navigation",
    children: (
      <>
        <SidebarItem href="/dashboard" isActive>
          Dashboard
        </SidebarItem>
        <SidebarItem href="/tickets">Tickets</SidebarItem>
        <SidebarItem href="/documents">Documents</SidebarItem>
      </>
    ),
  },
};

export const Collapsed: Story = {
  args: {
    title: "Admin",
    defaultOpen: false,
    children: (
      <>
        <SidebarItem href="/admin/users">Users</SidebarItem>
        <SidebarItem href="/admin/roles">Roles</SidebarItem>
        <SidebarItem href="/admin/audit">Audit Log</SidebarItem>
      </>
    ),
  },
};

export const WithBadges: Story = {
  args: {
    title: "Support",
    children: (
      <>
        <SidebarItem
          href="/tickets"
          badge={
            <span className="bg-emerald-600 text-[#0A1118] text-xs px-1.5 py-0.5 rounded-full font-bold">
              12
            </span>
          }
        >
          Open Tickets
        </SidebarItem>
        <SidebarItem
          href="/tickets/assigned"
          badge={
            <span className="bg-amber-500/20 text-amber-300 text-xs px-1.5 py-0.5 rounded-full">
              3
            </span>
          }
        >
          Assigned
        </SidebarItem>
      </>
    ),
  },
};

export const DisabledItems: Story = {
  args: {
    title: "Settings",
    children: (
      <>
        <SidebarItem href="/settings/profile">Profile</SidebarItem>
        <SidebarItem href="/settings/security">Security</SidebarItem>
        <SidebarItem href="/settings/billing" disabled>
          Billing
        </SidebarItem>
        <SidebarItem href="/settings/api" disabled>
          API Keys
        </SidebarItem>
      </>
    ),
  },
};

export const MultipleGroups: Story = {
  render: () => (
    <div className="w-64 space-y-2">
      <SidebarGroup title="Main">
        <SidebarItem href="/dashboard" isActive>
          Dashboard
        </SidebarItem>
        <SidebarItem href="/tickets">Tickets</SidebarItem>
        <SidebarItem href="/documents">Documents</SidebarItem>
      </SidebarGroup>
      <SidebarGroup title="Admin" defaultOpen={false}>
        <SidebarItem href="/admin/users">Users</SidebarItem>
        <SidebarItem href="/admin/audit">Audit Log</SidebarItem>
      </SidebarGroup>
    </div>
  ),
};
