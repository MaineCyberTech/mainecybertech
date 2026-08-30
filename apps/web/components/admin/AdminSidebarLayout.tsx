"use client";

import type { ReactNode } from "react";
import SidebarShell from "@/components/layout/SidebarShell";
import type { ServerPermissionData } from "@/lib/use-permissions";
import AdminSidebarContent from "./AdminSidebarContent";

export default function AdminSidebarLayout({
  children,
  permissions,
}: {
  children: ReactNode;
  permissions?: ServerPermissionData | null;
}) {
  return (
    <SidebarShell
      navLabel="Open admin navigation"
      brandLabel="Admin"
      content={<AdminSidebarContent mobile permissions={permissions} />}
    >
      {children}
    </SidebarShell>
  );
}
