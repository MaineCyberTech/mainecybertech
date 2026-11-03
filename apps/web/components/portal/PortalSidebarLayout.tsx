"use client";

import type { ReactNode } from "react";
import SidebarShell from "@/components/layout/SidebarShell";
import type { ServerPermissionData } from "@/lib/use-permissions";
import PortalSidebarContent from "./PortalSidebarContent";

export default function PortalSidebarLayout({
  children,
  permissions,
  enabledModules,
}: {
  children: ReactNode;
  permissions?: ServerPermissionData | null;
  enabledModules?: string[] | null;
}) {
  return (
    <SidebarShell
      navLabel="Open portal navigation"
      brandLabel="Portal"
      content={
        <PortalSidebarContent mobile permissions={permissions} enabledModules={enabledModules} />
      }
    >
      {children}
    </SidebarShell>
  );
}
